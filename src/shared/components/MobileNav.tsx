import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { NavLink } from "react-router";

import { Menu, X } from "@/shared/ui";
import { cn } from "@/shared/utils";

import type { SiteNavItem } from "./SiteHeader";

export interface MobileNavProps {
  items: readonly SiteNavItem[];
  className?: string;
}

/**
 * 移动端全屏抽屉导航：基于 Radix Dialog 获得焦点圈闭、Esc 关闭、
 * body 滚动锁定与 ARIA 语义（无障碍红线，基线 §12）。
 * 触控目标：菜单项 min-h-14（56px ≥ 44px）。
 */
export function MobileNav({ items, className }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label="打开导航菜单"
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-control text-secondary transition-colors duration-(--motion-fast) hover:bg-raised hover:text-primary",
          className,
        )}
      >
        <Menu aria-hidden="true" className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-(--z-modal) flex flex-col bg-base data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in motion-reduce:animate-none"
        >
          <DialogPrimitive.Title className="sr-only">导航菜单</DialogPrimitive.Title>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-default px-4 sm:px-6">
            <span className="font-mono text-lg font-semibold tracking-tight text-primary">
              Cogniflux
            </span>
            <DialogPrimitive.Close
              aria-label="关闭导航菜单"
              className="inline-flex size-11 items-center justify-center rounded-control text-secondary transition-colors duration-(--motion-fast) hover:bg-raised hover:text-primary"
            >
              <X aria-hidden="true" className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="站点导航" className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={item.href === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-14 items-center rounded-control px-4 text-2xl font-medium transition-colors duration-(--motion-fast)",
                        isActive
                          ? "bg-raised text-primary"
                          : "text-secondary hover:bg-raised hover:text-primary",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
