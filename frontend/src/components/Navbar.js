import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

function Navbar() {
  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#7DCEA0] text-white p-8">
      <div className="text-3xl font-bold mb-12">
        Pos System
      </div>
      <nav className="space-y-4">
        <RouterLink
          to="/"
          className="block py-3 px-6 rounded-full hover:bg-[#66B588] transition-colors text-white font-medium"
        >
          Product
        </RouterLink>
        <RouterLink
          to="/orders"
          className="block py-3 px-6 rounded-full hover:bg-[#66B588] transition-colors text-white font-medium"
        >
          Order
        </RouterLink>
        <RouterLink
          to="/new-order"
          className="block py-3 px-6 rounded-full bg-[#98DBBC] hover:bg-[#66B588] transition-colors text-white font-medium"
        >
          + New Order
        </RouterLink>
      </nav>
    </div>
  );
}

export default Navbar;