import { ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface SavedViewSelectProps {
    value: string
    onValueChange: (value: string) => void
}

export function SavedViewSelect({ value, onValueChange }: SavedViewSelectProps) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)

    // Update input value when external value changes
    useEffect(() => {
        setInputValue(value)
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/[^0-9]/g, '')
        setInputValue(newValue)
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue) {
            onValueChange(inputValue)
            setOpen(false)
        }
    }

    const handleBlur = () => {
        if (inputValue) {
            onValueChange(inputValue)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
                >
                    {value ? `Saved View ${value}` : 'Enter view ID...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-4 bg-white border border-slate-200 shadow-md">
                <div className="flex flex-col gap-2">
                    <label htmlFor="viewId" className="text-sm font-medium text-slate-700">
                        View ID
                    </label>
                    <Input
                        id="viewId"
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        onBlur={handleBlur}
                        placeholder="Enter numeric ID"
                        className="border-slate-200 focus:border-slate-300 focus:ring-slate-200"
                    />
                    <p className="text-xs text-slate-500">
                        Press Enter or click outside to confirm
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    )
}
