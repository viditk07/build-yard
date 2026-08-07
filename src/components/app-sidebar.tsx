import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PHASES } from "@/lib/phases";
import { CATEGORIES, SUPPLIERS } from "@/lib/catalog";
import { CategoryIcon } from "@/components/material-tile";
import { ChevronRight, Home, LayoutGrid, Store, ShoppingCart, Box } from "lucide-react";

export function AppSidebar() {
  const { pathname, hash } = useRouterState({
    select: (s) => ({ pathname: s.location.pathname, hash: s.location.hash }),
  });

  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[image:var(--gradient-ember)] font-display text-sm font-bold text-ember-foreground shadow-sm">
            B
          </span>
          <span className="font-display text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            BuildYard
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { title: "Home", url: "/", icon: Home },
                { title: "Catalog", url: "/products", icon: LayoutGrid },
                { title: "3D Visualiser", url: "/visualiser", icon: Box },

                { title: "Suppliers", url: "/suppliers", icon: Store },
                { title: "Cart", url: "/cart", icon: ShoppingCart },
              ].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Build stages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PHASES.map((phase) => {
                const phasePath = `/build/${phase.id}`;
                const open = pathname === phasePath;
                return (
                  <Collapsible
                    key={phase.id}
                    defaultOpen={open}
                    className="group/collapsible"
                    asChild
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={phase.name}
                          isActive={open}
                          className="pr-7"
                        >
                          <span className="grid size-5 shrink-0 place-items-center rounded-md bg-sidebar-accent text-[10px] font-semibold text-sidebar-accent-foreground">
                            {phase.step}
                          </span>
                          <span className="truncate">{phase.name}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={open && !hash}>
                              <Link
                                to="/build/$phaseId"
                                params={{ phaseId: phase.id }}
                              >
                                All materials
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          {phase.subcategories.map((sub) => (
                            <SidebarMenuSubItem key={sub.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={open && hash === sub.id}
                              >
                                <Link
                                  to="/build/$phaseId"
                                  params={{ phaseId: phase.id }}
                                  hash={sub.id}
                                >
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CATEGORIES.map((c) => (
                <SidebarMenuItem key={c}>
                  <SidebarMenuButton asChild tooltip={c} size="sm">
                    <Link to="/products" search={{ category: c }}>
                      <CategoryIcon category={c} className="size-4" />
                      <span className="truncate">{c}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Suppliers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SUPPLIERS.slice(0, 6).map((s) => (
                <SidebarMenuItem key={s.id}>
                  <SidebarMenuButton asChild size="sm">
                    <Link to="/suppliers/$supplierId" params={{ supplierId: s.id }}>
                      <span className="truncate">{s.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="px-2 pb-1 text-xs text-muted-foreground">
          Trade pricing · GST added at checkout
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
