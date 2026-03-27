"use client";

import Card from "../../../components/Card";

export default function MonthlyCosts({ fixedCosts, onPaidToggle, onManage }) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-text">Monthly Costs</h2>
        <button onClick={onManage} className="text-xs text-muted hover:text-accent transition-colors">Edit</button>
      </div>

      {fixedCosts.length === 0 ? <p className="text-sm text-muted">No fixed costs found.</p> : (
        <ul>
          {fixedCosts.map((cost) => (
            <li key={cost.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="text-sm text-text">{cost.cost_name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text font-medium">£{parseFloat(cost.amount).toFixed(2)}</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cost.paid}
                    onChange={() => onPaidToggle(cost)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <span className={`text-xs ${cost.paid ? "text-positive" : "text-muted"}`}>
                    {cost.paid ? "Paid" : "Unpaid"}
                  </span>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
