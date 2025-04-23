import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as React from 'react'
import { type Team } from './types'

interface TeamSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
    teams: Team[]
}

export function TeamSwitcher({ className, teams, ...props }: TeamSwitcherProps) {
    const [selectedTeam, setSelectedTeam] = React.useState<Team>(teams[0])

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between">
                        {selectedTeam.name}
                        <span className="ml-2">▼</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuLabel>Switch team</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {teams.map((team) => (
                        <DropdownMenuItem
                            key={team.name}
                            onClick={() => setSelectedTeam(team)}
                            className="flex items-center gap-2"
                        >
                            <team.logo className="h-4 w-4" />
                            {team.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
