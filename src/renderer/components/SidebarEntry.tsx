import { MouseEventHandler } from 'react';
import { IconType } from 'react-icons';

export interface SidebarEntryProps {
  name: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  Icon: IconType;
  selected: boolean;
}

export default function SidebarEntry({
  name,
  Icon,
  onClick,
  selected,
}: SidebarEntryProps) {
  return (
    <div
      className={`sidebar-entry${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <Icon size={22} className="sidebar-icon" />
      <span className="sidebar-text">{name}</span>
    </div>
  );
}
