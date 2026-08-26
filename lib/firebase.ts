import {getApp, getApps, initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {Auth, getAuth, User} from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    Firestore,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import {
    Category,
    CategoryClass,
    CustomButton,
    DatabaseUser,
    Expense,
    ExpenseClass,
    Goal,
    GoalClass,
    MonthSummary,
    RecurringExpense,
} from "@/lib/Interfaces";
import {useEffect, useState} from "react";
import {Timestamp} from "@firebase/firestore";
import {getGuestData, getGuestSummary, isGuestUser, subscribeToGuestData, updateGuestData} from "@/lib/guestData";
// TODO add react-query-firebase to handle caching and offline data

// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
    .filter(([key, value]) => key !== "measurementId" && !value)
    .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missingFirebaseConfig.join(", ")}`);
}

// Initialize Firebase

let app;
let auth: Auth;
let analytics;
const usersDirectory: string = "Users"

const defaultCategoriesAndIcons: {[category: string]: string} = {
    "Food": "dashboard",
    "Groceries": "box",
    "Activities": "beach",
    "Housing": "home",
    "Transportation": "train",
    "Medical & Healthcare": "medical",
    "Personal Spending": "money"
}

if (typeof window !== 'undefined') {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    analytics = getAnalytics(app);
}

export {app, auth, analytics};

export async function ensureUserInDatabase(user: User): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, usersDirectory, user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        await saveUserToDatabase(user);
    }
}

export async function saveUserToDatabase(user: User, userCategories: CategoryClass[] | null = null): Promise<void> {
    const db = getFirestore();
    const {uid, email, displayName, photoURL} = user;
    const ref = doc(db, usersDirectory, uid);

    const userData: DatabaseUser = {
        uid: uid,
        email: email ?? "",
        displayName: displayName ?? "",
        photoURL: photoURL,
    };
    await setDoc(ref, userData);

    //// create user's categories (list of default categories and icons is now global)
    // option to ask for user-desired categories during onboarding

    // create top level Categories collection 
    const categoriesCollectionRef = collection(db, usersDirectory, uid, "Categories");
    
    const newCategories: CategoryClass[] = [];
    if (userCategories) {
        // if custom categories passed, use those
        newCategories.push(...userCategories);
    }
    else {
         // otherwise create CategoryClass list of categories from defaults
        for (const category in defaultCategoriesAndIcons) {
            const icon: string = defaultCategoriesAndIcons[category];
            newCategories.push(new CategoryClass(category, icon, 0));
        }
    }

    // create and write category documents with the generated IDs
    for (const categoryClass of newCategories) {
        const categoryJson: Category = categoryClass.toJson();
        const categoryID = categoryClass.categoryID; // Ensure this ID is generated correctly
        const categoryDocRef = doc(categoriesCollectionRef, categoryID); // Reference to the document with ID "budget_id"
        await setDoc(categoryDocRef, categoryJson); // Use the category_id as the document ID
    }
    
    // create collection for the current month's expenses and summary document for current month
    // this will need to happen for each new month >> write into addExpense (if currMonth doc doesn't exist, create it)
    await createCurrentMonth(db, user, defaultCategoriesAndIcons);
    
}


async function createCurrentMonth(db: Firestore, user: User | null, categories: {[category: string]: string}) {
    // This is a helper function to create a new month summary document.
    //  Called when user is first created, or if current summary is not found
    //  (i.e. it's a new month - getMonthSummary, useCategoryBudgets) 
    if (user?.uid) {
        const monthCollectionRef = collection(db, usersDirectory, user.uid, "Months");
        const [thisMonth, thisYear] = getCurrentMonthYear();
        const monthDoc = doc(monthCollectionRef, [thisMonth, thisYear].join("_"));

        // create document for current month, containing initial summary info
        const categoryTotals: { [key: string]: number } = {}

        for (const cat in categories) {
            categoryTotals[cat] = 0;
        }

        const initialSummary: MonthSummary = {
            monthTotal: 0,
            categoryTotals: categoryTotals,
        }

        await setDoc(monthDoc, initialSummary);
    } else {
        throw new Error("User not found (create current month doc)");
    }
}

export function useCategories(user: User | null): Category[] | null {

    const [categories, setCategories] = useState<Category[] | null>(null);

    useEffect(() => {
        if (isGuestUser(user)) {
            const refresh = () => setCategories(getGuestData().categories
                .filter((category) => !category.is_deleted)
                .sort((a, b) => a.name.localeCompare(b.name)));
            refresh();
            return subscribeToGuestData(refresh);
        }
        if (user) {
            const db = getFirestore();
            const userRef = doc(db, usersDirectory, user.uid);
            const categoriesRef = collection(userRef, "Categories");

            const categoryQuery = query(categoriesRef);
            const unsubscribe = onSnapshot(categoryQuery, (snapshot) => {
                const newCategories: Category[] = [];
                snapshot.forEach((doc) => {
                    const category = doc.data() as Category;
                    if (!category.is_deleted) {
                        newCategories.push(category);
                    }
                });
                setCategories(newCategories.sort((a, b) => a.name.localeCompare(b.name)));
            });

            return () => unsubscribe();
        }
    }, [user]);
    // console.log("useCategories")
    return categories;
}


export async function addOrUpdateExpense(user: User | null, expense: ExpenseClass, createRecurrence: boolean = false) {
    // TODO update. Should be `addOrUpdateExpense` and handle both cases
    // this function sends an expense to firebase
    // this function is not reactive. It is used to send a single expense to firebase
    if (isGuestUser(user)) {
        const recurringExpenseID = expense.recurringExpenseID ?? (createRecurrence ? expense.id : undefined);
        const expenseID = createRecurrence ? createRecurringOccurrenceID(recurringExpenseID!, expense.month, expense.year) : expense.id;
        const guestExpense: Expense = {
            ...expense.toJson(),
            id: expenseID,
            date: expense.date instanceof Date ? expense.date : new Date(),
            ...(recurringExpenseID ? {recurringExpenseID, recurrenceActive: true} : {}),
        };
        updateGuestData((data) => ({
            ...data,
            expenses: data.expenses.some((item) => item.id === expenseID)
                ? data.expenses.map((item) => item.id === expenseID ? guestExpense : item)
                : [...data.expenses, guestExpense],
        }));
        return;
    }
    if (user?.uid) {
        const db: Firestore = getFirestore();
        try {
            // get reference to expense's month
            const monthString = createMonthYearString(expense.month, expense.year);
            const monthRef = doc(db, usersDirectory, user.uid, "Months", monthString);

            // Fetch the document from Firestore to check if it exists
            const recurringExpenseID = expense.recurringExpenseID ?? (createRecurrence ? expense.id : undefined);
            const expenseID = createRecurrence
                ? createRecurringOccurrenceID(recurringExpenseID!, expense.month, expense.year)
                : expense.id;
            const expenseRef = doc(monthRef, "Expenses", expenseID);
            const expenseDoc = await getDoc(expenseRef);

            // UPDATE EXPENSE
            if (expenseDoc.exists()) {
                await runTransaction(db, async (transaction) => {
                    const currentExpenseDoc = await transaction.get(expenseRef);
                    if (!currentExpenseDoc.exists()) {
                        throw new Error(`Expense ${expenseID} no longer exists`);
                    }
                    const previousExpense = currentExpenseDoc.data() as Expense;

                    transaction.update(expenseRef, {
                        name: expense.name,
                        amount: expense.amount,
                        categoryID: expense.categoryID,
                        description: expense.description,
                        vendor: expense.vendor,
                    });

                    const summaryUpdates: Record<string, ReturnType<typeof increment>> = {
                        monthTotal: increment(expense.amount - previousExpense.amount),
                    };
                    if (previousExpense.categoryID === expense.categoryID) {
                        summaryUpdates[`categoryTotals.${expense.categoryID}`] = increment(expense.amount - previousExpense.amount);
                    } else {
                        summaryUpdates[`categoryTotals.${previousExpense.categoryID}`] = increment(-previousExpense.amount);
                        summaryUpdates[`categoryTotals.${expense.categoryID}`] = increment(expense.amount);
                    }
                    transaction.update(monthRef, summaryUpdates);

                    if (recurringExpenseID) {
                        transaction.set(
                            doc(db, usersDirectory, user.uid, "RecurringExpenses", recurringExpenseID),
                            {
                                name: expense.name,
                                categoryID: expense.categoryID,
                                amount: expense.amount,
                                description: expense.description,
                                vendor: expense.vendor,
                            },
                            {merge: true},
                        );
                    }
                });
                
                console.log(`Expense document updated with ID: ${expense.id}`);
                // TODO: account for an expense changing amounts or categories

            // ADD NEW EXPENSE
            } else {
                await runTransaction(db, async (transaction) => {
                    const existingExpense = await transaction.get(expenseRef);
                    if (existingExpense.exists()) return;

                    transaction.set(expenseRef, {
                        ...expense.toJson(),
                        id: expenseID,
                        ...(recurringExpenseID ? {recurringExpenseID} : {}),
                        ...(recurringExpenseID ? {recurrenceActive: true} : {}),
                    });
                    transaction.set(monthRef, {
                        monthTotal: increment(expense.amount),
                        categoryTotals: {
                            [expense.categoryID]: increment(expense.amount),
                        },
                    }, {merge: true});

                    if (recurringExpenseID) {
                        transaction.set(
                            doc(db, usersDirectory, user.uid, "RecurringExpenses", recurringExpenseID),
                            recurringExpenseFromExpense(expense, recurringExpenseID),
                        );
                    }
                });
                console.log("Expense document added with ID: ", expenseRef.id);
            }
            
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    }
}

export async function deactivateRecurringExpense(user: User | null, expense: Expense): Promise<void> {
    if (!user) throw new Error("User not found");
    if (!expense.recurringExpenseID) throw new Error("Expense is not recurring");

    if (isGuestUser(user)) {
        updateGuestData((data) => ({...data, expenses: data.expenses.map((item) =>
            item.id === expense.id ? {...item, recurrenceActive: false} : item)}));
        return;
    }

    const db = getFirestore();
    const recurringRef = doc(db, usersDirectory, user.uid, "RecurringExpenses", expense.recurringExpenseID);
    const expenseRef = doc(db, usersDirectory, user.uid, "Months", createMonthYearString(expense.month, expense.year), "Expenses", expense.id);

    await runTransaction(db, async (transaction) => {
        transaction.update(recurringRef, {is_active: false});
        transaction.update(expenseRef, {recurrenceActive: false});
    });
}

function recurringExpenseFromExpense(expense: ExpenseClass, id: string): RecurringExpense {
    return {
        id,
        name: expense.name,
        categoryID: expense.categoryID,
        amount: expense.amount,
        description: expense.description,
        vendor: expense.vendor,
        startMonth: expense.month,
        startYear: expense.year,
        frequency: "monthly",
        is_active: true,
    };
}

function createRecurringOccurrenceID(recurringExpenseID: string, month: number, year: number): string {
    return `${recurringExpenseID}_${month}_${year}`;
}

export async function materializeRecurringExpenses(
    user: User | null,
    month: number = new Date().getMonth() + 1,
    year: number = new Date().getFullYear(),
): Promise<void> {
    if (!user) return;
    if (isGuestUser(user)) return;

    const db = getFirestore();
    const recurringSnapshot = await getDocs(collection(db, usersDirectory, user.uid, "RecurringExpenses"));
    const targetMonthIndex = year * 12 + month;

    await Promise.all(recurringSnapshot.docs.map(async (recurringDoc) => {
        const recurring = recurringDoc.data() as RecurringExpense;
        const startMonthIndex = recurring.startYear * 12 + recurring.startMonth;
        if (!recurring.is_active || recurring.frequency !== "monthly" || targetMonthIndex < startMonthIndex) return;

        const monthRef = doc(db, usersDirectory, user.uid, "Months", createMonthYearString(month, year));
        const expenseID = createRecurringOccurrenceID(recurring.id, month, year);
        const expenseRef = doc(monthRef, "Expenses", expenseID);

        await runTransaction(db, async (transaction) => {
            const existingExpense = await transaction.get(expenseRef);
            if (existingExpense.exists()) return;

            transaction.set(expenseRef, {
                id: expenseID,
                name: recurring.name,
                categoryID: recurring.categoryID,
                amount: recurring.amount,
                description: recurring.description,
                vendor: recurring.vendor,
                date: new Date(year, month - 1, 1),
                month,
                year,
                is_monthly: true,
                is_yearly: false,
                is_deleted: false,
                recurringExpenseID: recurring.id,
                recurrenceActive: true,
            } satisfies Expense);
            transaction.set(monthRef, {
                monthTotal: increment(recurring.amount),
                categoryTotals: {
                    [recurring.categoryID]: increment(recurring.amount),
                },
            }, {merge: true});
        });
    }));
}


export async function getMonthSummary(user: User | null, month?: string): Promise<MonthSummary> {
    /**
     This function retrieves the current month's summary
     data for a specific user from the Firestore database.
     The summary is expected to be stored in a specific path based
     on the user's unique identifier (UID) and the current month.
     */
    if (isGuestUser(user)) {
        const [monthNumber, yearNumber] = month
            ? month.split("_").map(Number)
            : [new Date().getMonth() + 1, new Date().getFullYear()];
        return getGuestSummary(monthNumber, yearNumber);
    }
    if (user?.uid) {
        const db = getFirestore();

        const [thisMonth, thisYear] = getCurrentMonthYear();
        const monthString = month ? month : [thisMonth, thisYear].join("_");

        const monthDoc = await getDoc(doc(db, usersDirectory, user.uid, "Months", monthString));

        // const summaryDoc = await getDoc(doc(monthRef, "summary"));
        if (!monthDoc.exists()) {
            console.log("Month summary does not exist; creating:", monthString);
            // await createCurrentMonth(db, user);
            throw new Error("Month summary does not exist");
        }
        return monthDoc.data() as MonthSummary;
    } else {
        throw new Error("User not found (get current summary")
    }
}


export async function addCategory(user: User | null, category: Category): Promise<void> {
    if (!user) {
        throw new Error("User not found");
    }

    const name = category.name.trim();
    if (!name) {
        throw new Error("Category name is required");
    }
    if (!Number.isFinite(category.amount) || category.amount < 0) {
        throw new Error("Category budget must be a non-negative number");
    }

    if (isGuestUser(user)) {
        const duplicateExists = getGuestData().categories.some((existingCategory) =>
            !existingCategory.is_deleted && existingCategory.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
        if (duplicateExists) throw new Error(`A category named "${name}" already exists`);
        updateGuestData((data) => ({...data, categories: [...data.categories, {...category, name, is_deleted: false}]}));
        return;
    }

    const db = getFirestore();
    const categoriesRef = collection(db, usersDirectory, user.uid, "Categories");
    const categoriesSnapshot = await getDocs(categoriesRef);
    const duplicateExists = categoriesSnapshot.docs.some((categoryDoc) => {
        const existingCategory = categoryDoc.data() as Category;
        return !existingCategory.is_deleted && existingCategory.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase();
    });

    if (duplicateExists) {
        throw new Error(`A category named "${name}" already exists`);
    }

    const categoryRef = doc(categoriesRef, category.categoryID);
    await setDoc(categoryRef, {...category, name, is_deleted: false});
}

type CategoryUpdates = Partial<Pick<Category, "amount" | "icon" | "is_monthly">>;

export async function updateCategory(user: User | null, categoryID: string, updates: CategoryUpdates): Promise<void> {
    if (!user) {
        throw new Error("User not found");
    }

    if (updates.amount !== undefined && (!Number.isFinite(updates.amount) || updates.amount < 0)) {
        throw new Error("Category budget must be a non-negative number");
    }

    if (isGuestUser(user)) {
        updateGuestData((data) => ({...data, categories: data.categories.map((category) =>
            category.categoryID === categoryID ? {...category, ...updates} : category)}));
        return;
    }

    const db = getFirestore();
    const categoryRef = doc(db, usersDirectory, user.uid, "Categories", categoryID);
    await updateDoc(categoryRef, updates);
}

export async function deleteCategory(user: User | null, categoryID: string): Promise<void> {
    if (!user) {
        throw new Error("User not found");
    }

    if (isGuestUser(user)) {
        updateGuestData((data) => ({...data, categories: data.categories.map((category) =>
            category.categoryID === categoryID ? {...category, is_deleted: true} : category)}));
        return;
    }

    const db = getFirestore();
    const categoryRef = doc(db, usersDirectory, user.uid, "Categories", categoryID);
    await updateDoc(categoryRef, {is_deleted: true});
}

export async function changeCategoryIcon(user: User, iconName: string, categoryID: string): Promise<void> {
    await updateCategory(user, categoryID, {icon: iconName});
}

export function useSummary(user: User | null, month?: number, year?: number): MonthSummary | undefined {
    const [summary, setSummary] = useState<MonthSummary>();
    useEffect(() => {
        if (isGuestUser(user)) {
            const refresh = () => setSummary(getGuestSummary(month, year));
            refresh();
            return subscribeToGuestData(refresh);
        }
        if (user) {
            const db = getFirestore();
            const userRef = doc(db, usersDirectory, user.uid);
    
            // get month summary from Month's document
            const [thisMonth, thisYear] = getCurrentMonthYear();
            const monthString = month && year ? createMonthYearString(month, year) : [thisMonth, thisYear].join("_");
    
            const unsubscribe = onSnapshot(doc(userRef, "Months", monthString), (doc) => {
                setSummary(doc.data() as MonthSummary);
            });

            return () => {
                unsubscribe();
            }
        } 
    }, [user, month, year]);

    // console.log("useSummary")
    return summary;
}

export function useExpenses(user: User | null,monthly?: boolean, month?: number, year?: number ): Expense[] {
    /**
     * this function is the hook version of the `getExpenses` function above.
     * Instead of doing it once, it will listen for changes and update accordingly.
     */

    const [expenses, setExpenses] = useState<Expense[]>([]);


    useEffect(() => {
        if (isGuestUser(user)) {
            const refresh = () => {
                const targetMonth = month ?? new Date().getMonth() + 1;
                const targetYear = year ?? new Date().getFullYear();
                setExpenses(getGuestData().expenses
                    .filter((expense) => !expense.is_deleted && expense.month === targetMonth && expense.year === targetYear)
                    .filter((expense) => monthly ? expense.is_monthly : !expense.is_monthly)
                    .sort((a, b) => guestDate(b.date).getTime() - guestDate(a.date).getTime()));
            };
            refresh();
            return subscribeToGuestData(refresh);
        }
        if (user) {
            const db = getFirestore();
            const userRef = doc(db, usersDirectory, user.uid);
            
            const [thisMonth, thisYear] = getCurrentMonthYear();
            const monthString = month && year ? createMonthYearString(month, year) : [thisMonth, thisYear].join("_");

            // get this month's expenses from Expenses collection
            const expensesRef = collection(userRef, "Months", monthString, "Expenses");
            const expensesQuery = query(expensesRef, orderBy("date", "desc"));

            void materializeRecurringExpenses(user, Number(monthString.split("_")[0]), Number(monthString.split("_")[1]))
                .catch((error) => console.error("Error creating recurring expenses: ", error));

            const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
                const newExpenses: Expense[] = [];
                snapshot.forEach((doc) => {
                    if (doc.id !== "summary") {
                        const expenseData = doc.data() as Expense;
                        // console.log("monthly: ", expenseData.name, expenseData.is_monthly)
                        if (expenseData.date instanceof Timestamp) {
                            // const date: Date = expenseData.date.toDate();
                            expenseData.date = expenseData.date.toDate();
                        }

                        if (monthly === undefined || !monthly) {
                            if (!expenseData.is_monthly) {
                                newExpenses.push(expenseData);
                            }
                        } else if (monthly) {
                            if (expenseData.is_monthly) {
                                newExpenses.push(expenseData);
                            }
                        }
                    }
                });
                setExpenses(newExpenses);
                // console.log("new expenses: ", newExpenses)
            });

            return () => {
                unsubscribe();
            }
        }
    }, [user, month, year, monthly]);

    return expenses;
}

// get function for analysis page
// not a hook
export async function getMonthMetadata(user: User | null, month?: number, year?: number): Promise<[Category[], MonthSummary]> {
    if (isGuestUser(user)) {
        return [
            getGuestData().categories.filter((category) => !category.is_deleted),
            getGuestSummary(month, year),
        ];
    }
    if (user) {
        const db = getFirestore();
        const userRef = doc(db, usersDirectory, user.uid);

        // get budget info from Categories collection
        const categoriesRef = collection(userRef, "Categories");
        const categories: Category[] = [];

        const categoryDocs = await getDocs(categoriesRef); 
        categoryDocs.forEach((doc) => {
            categories.push(doc.data() as Category);
        });
    
        // get month summary from Month's document
        const [thisMonth, thisYear] = getCurrentMonthYear();
        const monthString = month && year ? createMonthYearString(month, year) : [thisMonth, thisYear].join("_");

        const monthRef = await getDoc(doc(userRef, "Months", monthString));
        const monthSummary = monthRef.data() as MonthSummary;

        return [categories, monthSummary];
    } else {
        throw new Error("Error getting month metadata")
    }
}

// TODO: user document should no longer store category info
export async function getUserCategories(user: User | null): Promise<string[]> {
    // get category names only (stored as part of User document)
    if (isGuestUser(user)) {
        return getGuestData().categories
            .filter((category) => !category.is_deleted)
            .map((category) => category.name)
            .sort((a, b) => a.localeCompare(b));
    }
    if (user?.uid) {
        const db = getFirestore();

        const userRef = doc(db, usersDirectory, user.uid);

        const categoriesQuery = query(collection(userRef, "Categories"));
        const categoriesSnap = await getDocs(categoriesQuery);
          
        const categories: string[] = [];

        categoriesSnap.forEach((doc) => {
            const category = doc.data() as Category;
            if (!category.is_deleted) {
                categories.push(category.name);
            }
        })

        // if no data from Categories collection, check if user has categories stored in user document
        // TODO: remove this once all users have updated to new format
        if (categories.length == 0) {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data()?.categories) {
                return Object.keys(userSnap.data()["categories"]);
            }
        }
        
        return categories.sort((a, b) => a.localeCompare(b));
    }

    return ["Error returning categories"];
}

// ------- GOALS -------

export const useGoals = (user: User | null): Goal[] | null => {
    /**
     * This function is a React hook that returns goals
     * for a specific user from the Firestore database.
     */
    const [goals, setGoals] = useState<Goal[] | null>(null);

    useEffect(() => {
        if (isGuestUser(user)) {
            const refresh = () => setGoals(getGuestData().goals);
            refresh();
            return subscribeToGuestData(refresh);
        }
        if (user) {
            const db = getFirestore();
            const goalsRef = collection(db, usersDirectory, user.uid, "Goals");

            // const summaryDocRef = doc(goalsRef, "summary");

            const fetchAndUpdate = async () => {
                // console.log('Fetching and updating data...');

                const goalsSnap = await getDocs(goalsRef);
                // const summaryDoc = await getDoc(summaryDocRef);
                // if (!summaryDoc.exists()) {
                //     console.log("Creating summary doc for user goals... ")
                //    
                // }

                const goals: Goal[] = [];
                goalsSnap.forEach((doc) => {
                    const goalData = doc.data();
                    goalData.goal_date = goalData.goal_date.toDate();

                    goals.push(goalData as Goal);
                });

                setGoals(goals);
            };

            const unsubscribeGoals = onSnapshot(goalsRef, fetchAndUpdate);
            // const unsubscribeSummary = onSnapshot(summaryDocRef, fetchAndUpdate);

            // Unsubscribe from changes when the effect is cleaned up
            return () => {
                unsubscribeGoals();
                // unsubscribeSummary();
            };
        }
    }, [user]);
    // if (categoryBudgets === null) {
    //     console.warn("Category budgets is null. See Firebase.tsx file")
    //     console.log(categoryBudgets)
    //     return [];
    // }
    return goals;
};

export async function addNewGoal(user: User | null, goal_name: string, amt_goal: number, goal_date: Date) {
    if (user) {
        if (isGuestUser(user)) {
            const newGoal = new GoalClass(goal_name, amt_goal, goal_date).toJson();
            updateGuestData((data) => ({...data, goals: [...data.goals, newGoal]}));
            return;
        }
        const db = getFirestore();
        const goalsRef = collection(db, usersDirectory, user.uid, "Goals");

        try {
            // add new goal
            const new_goal = new GoalClass(goal_name, amt_goal, goal_date,)
            await setDoc(doc(goalsRef, new_goal.id), new_goal.toJson());
        } catch (error) {
            console.log("Error adding goal: ", error)
            throw error;
        }
    } else {
        throw new Error("User not found (adding new goal)")
    }
}

export async function editGoal(user: User | null, goal: Goal) {
    if (user) {
        if (isGuestUser(user)) {
            updateGuestData((data) => ({...data, goals: data.goals.map((item) => item.id === goal.id ? goal : item)}));
            return;
        }
        const db = getFirestore();
        const goalRef = doc(db, usersDirectory, user.uid, "Goals", goal.id);

        try {
            // edit existing goal
            await setDoc(goalRef, goal);
        } catch (error) {
            console.log("Error editing goal: ", goal.goal_name, error)
            throw error;
        }
    } else {
        throw new Error("User not found (editing goal)")
    }
}

export async function deleteGoal(user: User | null, goalID: string) {
    if (user) {
        if (isGuestUser(user)) {
            updateGuestData((data) => ({...data, goals: data.goals.filter((goal) => goal.id !== goalID)}));
            return;
        }
        const db = getFirestore();
        const goalRef = doc(db, usersDirectory, user.uid, "Goals", goalID);

        try {
            // delete existing goal
            await deleteDoc(goalRef);
        } catch (error) {
            console.log("Error editing goal: ", goalID, error)
            throw error;
        }
    } else {
        throw new Error("User not found (deleting goal)")
    }
}

// TODO: goal summary?

function getCurrentMonthYear(): [string, string] {
    // helper function to return the name of the current month's collection
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth returns month index starting from 0

    return [currentMonth.toString(), currentYear.toString()];
}

function createMonthYearString(month: number, year: number): string {
    return month.toString() + '_' + year.toString();
}

// BUTTONS


export function useButtons(user: User | null): { buttons: CustomButton[], loading: boolean } {
    const [buttons, setButtons] = useState<CustomButton[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // Initialize loading state to true

    useEffect(() => {
        if (isGuestUser(user)) {
            const refresh = () => {
                setButtons(getGuestData().buttons);
                setLoading(false);
            };
            refresh();
            return subscribeToGuestData(refresh);
        }
        if (user) {
            setLoading(true); // Set loading to true when data fetch starts

            const db = getFirestore();
            const userRef = doc(db, usersDirectory, user.uid);
            const buttonsRef = collection(userRef, "Buttons");

            const unsubscribe = onSnapshot(buttonsRef, (snapshot) => {
                const newButtons: CustomButton[] = [];
                snapshot.forEach((doc) => {
                    newButtons.push(doc.data() as CustomButton);
                });
                setButtons(newButtons);

                setLoading(false); // Set loading to false when data fetch is complete
            });

            return () => {
                unsubscribe();
            };
        } else {
            setLoading(false); // Set loading to false if there is no user
        }
    }, [user]); // Dependency array

    return {buttons, loading};
}

export async function addButton(user: User | null, newButton: CustomButton) {
    if (user) {
        if (isGuestUser(user)) {
            updateGuestData((data) => ({...data, buttons: [...data.buttons, newButton]}));
            return;
        }
        const db = getFirestore();
        const userRef = doc(db, usersDirectory, user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            console.error('User document does not exist:', user.uid);
            throw new Error('User document not found');
        }
        // Get a reference to the Buttons collection inside the user's document
        const buttonsCollectionRef = collection(userRef, 'Buttons');
        // Add the new button to the collection
        await addDoc(buttonsCollectionRef, newButton);

    } else {
        console.warn("User not found. `addButton` function failed.");
    }
}

function guestDate(value: Expense["date"]): Date {
    return value instanceof Date ? value : new Date();
}
