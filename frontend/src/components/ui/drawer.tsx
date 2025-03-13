"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../../lib/utils"

const drawerVariants = cva(
    "fixed inset-y-0 z-50 flex flex-col bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 ease-in-out",
    {
        variants: {
            side: {
                right: "right-0 border-l",
                left: "left-0 border-r",
            },
            size: {
                sm: "w-64",
                default: "w-80",
                lg: "w-96",
                xl: "w-[30rem]",
                full: "w-screen",
            },
        },
        defaultVariants: {
            side: "right",
            size: "default",
        },
    }
)

export interface DrawerProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof drawerVariants> {
    open?: boolean
    onClose?: () => void
}

const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
    ({ className, children, open, onClose, side, size, ...props }, ref) => {
        // Handle ESC key to close drawer
        React.useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape" && open && onClose) {
                    onClose()
                }
            }

            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }, [open, onClose])

        // Prevent body scroll when drawer is open
        React.useEffect(() => {
            if (open) {
                document.body.style.overflow = "hidden"
            } else {
                document.body.style.overflow = ""
            }

            return () => {
                document.body.style.overflow = ""
            }
        }, [open])

        if (!open) return null

        return (
            <div className="fixed inset-0 z-50">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Drawer */}
                <div
                    ref={ref}
                    className={cn(drawerVariants({ side, size }), className)}
                    style={{ backgroundColor: 'white' }}
                    {...props}
                >
                    {children}
                </div>
            </div>
        )
    }
)
Drawer.displayName = "Drawer"

const DrawerHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-4 border-b bg-white dark:bg-gray-900", className)}
        {...props}
    />
))
DrawerHeader.displayName = "DrawerHeader"

const DrawerTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("text-lg font-semibold", className)}
        {...props}
    />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DrawerDescription.displayName = "DrawerDescription"

const DrawerContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex-1 overflow-auto p-4 bg-white dark:bg-gray-900", className)}
        {...props}
    />
))
DrawerContent.displayName = "DrawerContent"

const DrawerFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t p-4 bg-white dark:bg-gray-900", className)}
        {...props}
    />
))
DrawerFooter.displayName = "DrawerFooter"

const DrawerClose = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
    <button
        ref={ref}
        className={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
            className
        )}
        {...props}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
        >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span className="sr-only">Close</span>
    </button>
))
DrawerClose.displayName = "DrawerClose"

export {
    Drawer,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerContent,
    DrawerFooter,
    DrawerClose,
} 