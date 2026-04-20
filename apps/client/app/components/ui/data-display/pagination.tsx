'use client'

import { CaretLeftIcon, CaretRightIcon, DotsThreeIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '@/app/components/ui/primitives/button'
import { cn } from '@/app/lib/utils'

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="pagination-item"
      className={cn('flex items-center', className)}
      {...props}
    />
  )
}

type PaginationLinkProps = {
  isActive?: boolean
}
& Pick<React.ComponentProps<typeof Button>, 'size'>
& React.ComponentProps<'a'>

function PaginationLink({
  className,
  isActive,
  size = 'icon-xs',
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      asChild
      variant="ghost"
      size={size}
      className={cn(
        'leading-none',
        isActive
          ? 'border-primary/80 bg-transparent text-primary hover:bg-primary/12 aria-expanded:bg-primary/12'
          : undefined,
        className,
      )}
    >
      <a
        aria-current={isActive ? 'page' : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      />
    </Button>
  )
}

function PaginationPrevious({
  className,
  text = 'Previous',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="icon-xs"
      className={cn('px-1.5!', className)}
      {...props}
    >
      <CaretLeftIcon data-icon="inline-start" />
      {text && <span className="hidden sm:block">{text}</span>}
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = 'Next',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="icon-xs"
      className={cn('px-1.5!', className)}
      {...props}
    >
      {text && <span className="hidden sm:block">{text}</span>}
      <CaretRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        'flex size-6 items-center justify-center text-muted-foreground [&_svg:not([class*=\'size-\'])]:size-3',
        className,
      )}
      {...props}
    >
      <DotsThreeIcon />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
