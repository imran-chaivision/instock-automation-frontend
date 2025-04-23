import * as React from 'react'
import { type NavGroup as NavGroupType } from './types'

interface NavGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    group: NavGroupType
}

export function NavGroup({ className, group, ...props }: NavGroupProps) {
    return (
        <div className={className} {...props}>
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                {group.title}
            </h2>
            <div className="space-y-1">
                {group.items.map((item) => (
                    <div key={item.title}>
                        {item.items ? (
                            <div className="space-y-1">
                                <h3 className="px-4 text-sm font-medium">{item.title}</h3>
                                {item.items.map((subItem) => (
                                    <a
                                        key={subItem.title}
                                        href={subItem.url as string}
                                        className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                    >
                                        {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                        {subItem.title}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <a
                                href={item.url as string}
                                className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                            >
                                {item.icon && <item.icon className="h-4 w-4" />}
                                {item.title}
                                {item.badge && (
                                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                        {item.badge}
                                    </span>
                                )}
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
