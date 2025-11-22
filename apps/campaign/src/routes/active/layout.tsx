import { Outlet } from 'react-router'
import { useTick } from './tick'

export function ActiveLayout() {
  useTick()
  return (
    <div>
      <Outlet />
    </div>
  )
}
