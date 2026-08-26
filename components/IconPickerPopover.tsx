// IconPickerPopover.tsx
import React, {useState} from 'react';
import IconPicker from '@/components/IconPicker';
import {icons} from '@/lib/icons';
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"

interface IconPickerPopoverProps {
    categoryID?: string;
    selectedIconName?: string | undefined;
    onIconSelect?: (iconId: string) => void;
    zIndex?: number;
}

export default function IconPickerPopover({selectedIconName, onIconSelect, categoryID, zIndex = 1}: IconPickerPopoverProps) {
    const selectedIconFound = icons.find(icon => icon.name === selectedIconName);
    const [selectedIcon, setSelectedIcon] = useState("home")

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="Choose category icon"
                    style = {{
                        zIndex: zIndex
                    }}
                    className={"bg-gray-100 p-1 rounded-lg hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"}
                >
                    {selectedIconName ? selectedIconFound?.component : icons.find(icon => icon.name === selectedIcon)?.component}

                </button>
            </PopoverTrigger>
            <PopoverContent>
                <IconPicker onSelect={onIconSelect ? onIconSelect : setSelectedIcon} categoryID={categoryID}/>
            </PopoverContent>
        </Popover>


    );
}
