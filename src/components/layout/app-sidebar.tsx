import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { Sidebar } from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <div className="flex h-full flex-col">
        <div className="p-4">
          <TeamSwitcher teams={sidebarData.teams} />
        </div>
        <div className="flex-1 overflow-auto">
          {sidebarData.navGroups.map((group) => (
            <NavGroup key={group.title} group={group} />
          ))}
        </div>
        <div className="p-4">
          <NavUser user={sidebarData.user} />
        </div>
      </div>
    </Sidebar>
  )
}
