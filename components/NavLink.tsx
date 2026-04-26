'use client'
import Link from 'next/link'
import type { ComponentProps } from 'react'

type NavLinkProps = ComponentProps<typeof Link>

export function NavLink({ onClick, ...props }: NavLinkProps) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    document.body.classList.add('navigating')
    onClick?.(e)
  }

  return <Link {...props} onClick={handleClick} />
}
