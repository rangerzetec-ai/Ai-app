import { useState, useEffect } from "react";
import { DollarSign, Plus, Edit, Trash2, Receipt, TrendingUp, Calculator, AlertCircle } from "lucide-react";
import { Project, type ProjectFinancials, ProjectExpense, ProjectRevenue, ExpenseCategory, CreateProjectExpense, CreateProjectRevenue } from "@/shared/types";
import ExpenseForm from "./ExpenseForm";
import RevenueForm from "./RevenueForm";

interface ProjectFinancialsProps {
  project: Project;
  onUpdate?: () => void;
}

export default function ProjectFinancials({ project, onUpdate }: ProjectFinancialsProps) {
  const [, setFinancials] = useState<ProjectFinancials | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [revenues, setRevenues] = useState<ProjectRevenue[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'revenues'>('overview');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [project.id]);

  const fetchFinancialData = async () => {
    try {
      const [financialsRes, expensesRes, revenuesRes, categoriesRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/financials`),
        fetch(`/api/projects/${project.id}/expenses`),
        fetch(`/api/projects/${project.id}/revenues`),
        fetch(`/api/expense-categories`)
      ]);

      if (financialsRes.ok) {
        const financialsData = await financialsRes.json();
        setFinancials(financialsData);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (revenuesRes.ok) {
        const revenuesData = await revenuesRes.json();
        setRevenues(revenuesData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setExpenseCategories(categoriesData);
      }
    } catch (error) {
      console.error("Failed to fetch financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (data: CreateProjectExpense) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowExpenseForm(false);
        fetchFinancialData();
        onUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add expense");
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
      throw error;
    }
  };

  const handleAddRevenue = async (data: CreateProjectRevenue) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/revenues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowRevenueForm(false);
        fetchFinancialData();
        onUpdate?.();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add revenue");
      }
    } catch (error) {
      console.error("Failed to add revenue:", error);
      throw error;
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRevenues = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  const netProfit = totalRevenues - totalExpenses;
  const profitMargin = totalRevenues > 0 ? ((netProfit / totalRevenues) * 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calculator className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-slate-900">Project Financials</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowExpenseForm(true)}
            className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Expense
          </button>
          <button
            onClick={() => setShowRevenueForm(true)}
            className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Revenue
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalRevenues)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <Receipt className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className={`border rounded-xl p-4 ${netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>{formatCurrency(netProfit)}</p>
            </div>
            <DollarSign className={`w-8 h-8 ${netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-900">{profitMargin.toFixed(1)}%</p>
            </div>
            <Calculator className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Profit Margin Alert */}
      {profitMargin < 15 && totalRevenues > 0 && (
        <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <h4 className="font-medium text-orange-800">Low Profit Margin Alert</h4>
              <p className="text-sm text-orange-700">
                This project has a profit margin of {profitMargin.toFixed(1)}%. Consider reviewing expenses or pricing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Calculator },
            { id: 'expenses', label: `Expenses (${expenses.length})`, icon: Receipt },
            { id: 'revenues', label: `Revenues (${revenues.length})`, icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Expense Breakdown by Category */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Expense Breakdown by Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expenseCategories.map((category) => {
                const categoryExpenses = expenses.filter(e => e.category_id === category.id);
                const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
                const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0;
                
                if (categoryTotal === 0) return null;
                
                return (
                  <div key={category.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-700">{category.name}</span>
                      <span className="text-sm text-slate-600">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(categoryTotal)}</span>
                      <span className="text-sm text-slate-500">{categoryExpenses.length} items</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Recent Transactions</h4>
            <div className="space-y-3">
              {[...expenses.slice(-3).map(e => ({ ...e, type: 'expense' })), 
                ...revenues.slice(-3).map(r => ({ ...r, type: 'revenue' }))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((transaction) => (
                <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${transaction.type === 'expense' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No expenses recorded yet</p>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Expense
              </button>
            </div>
          ) : (
            expenses.map((expense) => {
              const category = expenseCategories.find(c => c.id === expense.category_id);
              return (
                <div key={expense.id} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h5 className="font-medium text-slate-900 mr-3">{expense.description}</h5>
                        {expense.is_billable && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Billable
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p><span className="font-medium">Category:</span> {category?.name}</p>
                        <p><span className="font-medium">Date:</span> {new Date(expense.expense_date).toLocaleDateString()}</p>
                        {expense.vendor_name && (
                          <p><span className="font-medium">Vendor:</span> {expense.vendor_name}</p>
                        )}
                        {expense.notes && <p><span className="font-medium">Notes:</span> {expense.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        {expense.receipt_url && (
                          <a
                            href={`/api/files/${expense.receipt_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Receipt className="w-4 h-4" />
                          </a>
                        )}
                        <button className="text-slate-600 hover:text-slate-700">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'revenues' && (
        <div className="space-y-4">
          {revenues.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No revenue recorded yet</p>
              <button
                onClick={() => setShowRevenueForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Revenue
              </button>
            </div>
          ) : (
            revenues.map((revenue) => (
              <div key={revenue.id} className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-slate-900 mb-2">{revenue.description}</h5>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium">Date:</span> {new Date(revenue.revenue_date).toLocaleDateString()}</p>
                      {revenue.payment_method && (
                        <p><span className="font-medium">Payment Method:</span> {revenue.payment_method}</p>
                      )}
                      {revenue.invoice_number && (
                        <p><span className="font-medium">Invoice:</span> {revenue.invoice_number}</p>
                      )}
                      {revenue.notes && <p><span className="font-medium">Notes:</span> {revenue.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(revenue.amount)}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getPaymentStatusColor(revenue.payment_status)}`}>
                      {revenue.payment_status.charAt(0).toUpperCase() + revenue.payment_status.slice(1)}
                    </span>
                    <div className="flex items-center mt-2 space-x-2">
                      <button className="text-slate-600 hover:text-slate-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Forms */}
      {showExpenseForm && (
        <ExpenseForm
          projectId={project.id}
          onSubmit={handleAddExpense}
          onCancel={() => setShowExpenseForm(false)}
        />
      )}

      {showRevenueForm && (
        <RevenueForm
          projectId={project.id}
          onSubmit={handleAddRevenue}
          onCancel={() => setShowRevenueForm(false)}
        />
      )}
    </div>
  );
}
