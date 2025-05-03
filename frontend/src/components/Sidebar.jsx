import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiPlusCircle,
  FiList,
  FiDollarSign,
  FiSettings,
} from 'react-icons/fi';

const Sidebar = () => {
  const activeClassName =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-amber-400 bg-slate-800 font-semibold shadow-inner transition-all duration-200";
  const inactiveClassName =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-amber-300 transition-all duration-200";

  return (
    <aside className="w-full md:w-64 h-screen bg-slate-900 text-gray-200 p-6 flex flex-col justify-between shadow-2xl">
      {/* Top Logo + Title */}
      <div>
        <img
          src="/logo.png"
          alt="Sky Diamond Dreams Logo"
          className="mx-auto mb-4 w-24 h-auto object-contain"
        />
        <h2 className="text-3xl font-extrabold text-amber-200 mb-10 text-center font-serif tracking-wide">
          Sky<span className="text-amber-200">Diamond Dreams</span>
        </h2>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => (isActive ? activeClassName : inactiveClassName)}
          >
            <FiGrid size={18} /> Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/create"
            className={({ isActive }) => (isActive ? activeClassName : inactiveClassName)}
          >
            <FiPlusCircle size={18} /> Create Invoice
          </NavLink>

          <NavLink
            to="/dashboard/invoices"
            className={({ isActive }) => (isActive ? activeClassName : inactiveClassName)}
          >
            <FiList size={18} /> View Invoices
          </NavLink>

          <NavLink
            to="/dashboard/rates"
            className={({ isActive }) => (isActive ? activeClassName : inactiveClassName)}
          >
            <FiDollarSign size={18} /> Update Rates
          </NavLink>

          {/* Optional Future Link */}
          {/* <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => (isActive ? activeClassName : inactiveClassName)}
          >
            <FiSettings size={18} /> Settings
          </NavLink> */}
        </nav>
      </div>

      {/* Footer */}
      <footer className="text-sm text-center text-slate-600 border-t border-slate-700 pt-4 mt-4">
        <p>© Sky Diamond Dreams {new Date().getFullYear()}</p>
      </footer>
    </aside>
  );
};

export default Sidebar;
