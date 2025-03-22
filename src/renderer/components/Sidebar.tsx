import { ReactElement, useState } from 'react';
import SidebarEntry, { SidebarEntryProps } from './SidebarEntry';
import { VscChevronLeft, VscChevronRight } from 'react-icons/vsc';
import './Sidebar.css';

type TSidebarEntry = ReactElement<SidebarEntryProps, typeof SidebarEntry>;

export type SidebarProps = {
  children: TSidebarEntry | TSidebarEntry[];
  iconOnly?: boolean;
  textOnly?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

export default function Sidebar({
  children,
  collapsible = true,
  defaultCollapsed = true,
  iconOnly = false,
  textOnly = false,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {collapsible && (
        <div
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <VscChevronRight size={20} />
          ) : (
            <VscChevronLeft size={20} />
          )}
        </div>
      )}
      <div className="sidebar-content">
        {Array.isArray(children) ? (
          children.map((child, index) => (
            <div key={index} className="sidebar-entry-wrapper">
              {child}
            </div>
          ))
        ) : (
          <div className="sidebar-entry-wrapper">{children}</div>
        )}
      </div>
    </div>
  );
}
