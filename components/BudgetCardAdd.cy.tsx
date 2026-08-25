import React from "react";

import BudgetCardAdd from "./BudgetCardAdd";
import {Category} from "@/lib/Interfaces";

const category: Category = {
    categoryID: "groceries_1",
    name: "Groceries",
    amount: 200,
    icon: "box",
    is_monthly: false,
    is_deleted: false,
};

describe("<BudgetCardAdd />", () => {
    it("shows the monthly budget, spending, and remaining amount", () => {
        cy.mount(
            <BudgetCardAdd
                category={category}
                spent={75}
                onEdit={cy.stub()}
                onDelete={cy.stub()}
            />
        );

        cy.contains("Groceries");
        cy.contains("$200.00 monthly budget");
        cy.contains("$75.00 spent");
        cy.contains("$125.00 left");
        cy.contains("38%");
    });

    it("shows when spending is over budget", () => {
        cy.mount(
            <BudgetCardAdd
                category={category}
                spent={250}
                onEdit={cy.stub()}
                onDelete={cy.stub()}
            />
        );

        cy.contains("$50.00 over");
        cy.contains("125%");
    });

    it("calls the edit and remove actions", () => {
        const onEdit = cy.stub().as("edit");
        const onDelete = cy.stub().as("remove");

        cy.mount(
            <BudgetCardAdd
                category={category}
                spent={0}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        );

        cy.contains("button", "Edit").click();
        cy.get("@edit").should("have.been.calledOnce");
        cy.contains("button", "Remove").click();
        cy.get("@remove").should("have.been.calledOnce");
    });
});
