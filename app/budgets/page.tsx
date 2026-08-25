"use client";

import React, {useEffect, useState} from "react";
import {Button, Group, Modal, NumberInput, Text, TextInput, Title, useMantineTheme} from "@mantine/core";
import {useForm} from "@mantine/form";
import {FiPlus} from "react-icons/fi";
import toast from "react-hot-toast";

import {useAuth} from "@/app/context";
import Loading from "@/app/loading";
import BudgetCardAdd from "@/components/BudgetCardAdd";
import IconPickerPopover from "@/components/IconPickerPopover";
import {addCategory, deleteCategory, updateCategory, useCategories, useSummary} from "@/lib/firebase";
import {Category, CategoryClass} from "@/lib/Interfaces";

const DEFAULT_ICON = "dashboard";

export default function Budgets() {
    const {user, loading} = useAuth();
    const {colorScheme} = useMantineTheme();
    const categories = useCategories(user);
    const summary = useSummary(user);
    const [formOpened, setFormOpened] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    if (loading) {
        return <Loading/>;
    }

    if (!user) {
        return <Text p="xl">Please log in to manage budgets.</Text>;
    }

    const openAddForm = () => {
        setEditingCategory(null);
        setFormOpened(true);
    };

    const openEditForm = (category: Category) => {
        setEditingCategory(category);
        setFormOpened(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) {
            return;
        }

        try {
            await deleteCategory(user, categoryToDelete.categoryID);
            toast.success(`${categoryToDelete.name} removed`);
            setCategoryToDelete(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to remove category");
        }
    };

    return (
        <div className={`p-6 ${colorScheme === "dark" ? "text-white" : "text-slate-900"}`}>
            <Group position="apart" align="flex-start" mb="xl">
                <div>
                    <Title order={1}>Budgets</Title>
                    <Text color="dimmed">Set a monthly spending target for each category.</Text>
                </div>
                <Button leftIcon={<FiPlus/>} onClick={openAddForm}>
                    Add category
                </Button>
            </Group>

            {categories === null ? (
                <Loading/>
            ) : categories.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                    <Title order={3}>No budget categories yet</Title>
                    <Text color="dimmed" mt="xs" mb="md">Add a category to start planning your spending.</Text>
                    <Button leftIcon={<FiPlus/>} onClick={openAddForm}>Add your first category</Button>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {categories.map((category) => (
                        <BudgetCardAdd
                            key={category.categoryID}
                            category={category}
                            spent={summary?.categoryTotals[category.name] ?? 0}
                            onEdit={() => openEditForm(category)}
                            onDelete={() => setCategoryToDelete(category)}
                        />
                    ))}
                </div>
            )}

            <CategoryFormModal
                category={editingCategory}
                opened={formOpened}
                onClose={() => setFormOpened(false)}
                onSubmit={async (values) => {
                    if (editingCategory) {
                        await updateCategory(user, editingCategory.categoryID, {
                            amount: values.amount,
                            icon: values.icon,
                        });
                        toast.success(`${editingCategory.name} updated`);
                    } else {
                        const category = new CategoryClass(values.name, values.icon, values.amount);
                        await addCategory(user, category);
                        toast.success(`${values.name.trim()} added`);
                    }
                    setFormOpened(false);
                }}
            />

            <Modal
                opened={categoryToDelete !== null}
                onClose={() => setCategoryToDelete(null)}
                title="Remove budget category?"
                centered
            >
                <Text>
                    Remove <strong>{categoryToDelete?.name}</strong> from your budgets? Existing expenses will be preserved.
                </Text>
                <Group position="right" mt="xl">
                    <Button variant="default" onClick={() => setCategoryToDelete(null)}>Cancel</Button>
                    <Button color="red" onClick={handleDelete}>Remove category</Button>
                </Group>
            </Modal>
        </div>
    );
}

type CategoryFormValues = {
    name: string;
    amount: number;
    icon: string;
};

interface CategoryFormModalProps {
    category: Category | null;
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: CategoryFormValues) => Promise<void>;
}

function CategoryFormModal({category, opened, onClose, onSubmit}: CategoryFormModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const form = useForm<CategoryFormValues>({
        initialValues: {name: "", amount: 0, icon: DEFAULT_ICON},
        validate: {
            name: (value) => value.trim().length > 0 ? null : "Category name is required",
            amount: (value) => Number.isFinite(value) && value >= 0 ? null : "Budget must be zero or greater",
        },
    });

    useEffect(() => {
        if (opened) {
            form.setValues({
                name: category?.name ?? "",
                amount: category?.amount ?? 0,
                icon: category?.icon ?? DEFAULT_ICON,
            });
            form.clearErrors();
        }
    }, [category, opened]);

    const handleSubmit = async (values: CategoryFormValues) => {
        setSubmitting(true);
        try {
            await onSubmit({...values, name: values.name.trim()});
            form.reset();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to save category");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={category ? `Edit ${category.name}` : "Add budget category"}
            centered
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                    label="Category name"
                    placeholder="e.g. Entertainment"
                    disabled={category !== null}
                    withAsterisk
                    {...form.getInputProps("name")}
                />
                <NumberInput
                    label="Monthly budget"
                    description="Enter 0 if you only want to track spending."
                    min={0}
                    precision={2}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                    formatter={(value) => !Number.isNaN(parseFloat(value)) ? `$ ${value}` : "$ "}
                    mt="md"
                    withAsterisk
                    {...form.getInputProps("amount")}
                />
                <div className="mt-4">
                    <Text size="sm" weight={500} mb={6}>Icon</Text>
                    <IconPickerPopover
                        selectedIconName={form.values.icon}
                        onIconSelect={(icon) => form.setFieldValue("icon", icon)}
                        zIndex={3}
                    />
                </div>
                <Group position="right" mt="xl">
                    <Button type="button" variant="default" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={submitting}>
                        {category ? "Save changes" : "Add category"}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
}
