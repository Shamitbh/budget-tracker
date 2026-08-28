import {Text, Title} from "@mantine/core";
import React from "react";

interface PageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export default function PageHeader({eyebrow, title, description, actions}: PageHeaderProps) {
    return (
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && <Text className="uppercase tracking-[0.16em]" color="dimmed" size="xs" weight={700}>{eyebrow}</Text>}
                <Title order={1} className="mt-1 text-3xl sm:text-4xl">{title}</Title>
                {description && <Text color="dimmed" mt={6}>{description}</Text>}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
        </header>
    );
}
