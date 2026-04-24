// ============ PHERE CONSTANTS ============

export const BRAND = {
  name: 'Phere',
  nameHindi: 'फेरे',
  tagline: 'Smart Wedding Expense Tracker',
  storage: 'phere-v3'
};

export const CATEGORIES = [
  { name: 'Venue/Hall', icon: '🏛️', color: '#8B1A3A' },
  { name: 'Catering/Khana', icon: '🍽️', color: '#C9A961' },
  { name: 'Decoration', icon: '🌸', color: '#D4756E' },
  { name: 'Photography', icon: '📸', color: '#4A7C59' },
  { name: 'Music/DJ', icon: '🎵', color: '#6B5050' },
  { name: 'Clothes - Dulhan', icon: '👗', color: '#C43E3E' },
  { name: 'Clothes - Dulha', icon: '🤵', color: '#2B1810' },
  { name: 'Jewelry/Zewar', icon: '💎', color: '#C9A961' },
  { name: 'Makeup/Mehendi', icon: '💄', color: '#D4756E' },
  { name: 'Transport', icon: '🚗', color: '#696969' },
  { name: 'Invitation/Cards', icon: '💌', color: '#8B1A3A' },
  { name: 'Pandit/Pooja', icon: '🕉️', color: '#C9A961' },
  { name: 'Tent/Furniture', icon: '⛺', color: '#4A7C59' },
  { name: 'Gifts/Trousseau', icon: '🎁', color: '#D4756E' },
  { name: 'Miscellaneous', icon: '📦', color: '#696969' }
];

export const defaultData = {
  expenses: [],
  shagun: [],
  vendors: [],
  guests: [],
  lena: [],   // Receivables — paise jo humein milne hain
  dena: [],   // Payables — paise jo humein dene hain
  settings: { coupleName: '', weddingDate: '', totalBudget: 1000000 }
};

export const AI_TOOLS = [
  {
    name: 'add_expense',
    description: 'Add a new wedding expense (kharcha). Use when user mentions they spent money or paid someone.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: `One of: ${CATEGORIES.map(c => c.name).join(', ')}` },
        description: { type: 'string', description: 'Short description of the expense' },
        amount: { type: 'number', description: 'Amount in INR' },
        vendor: { type: 'string', description: 'Vendor or shop name (optional)' },
        status: { type: 'string', enum: ['Paid', 'Pending'] },
        paymentMode: { type: 'string', enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card'] },
        paidBy: { type: 'string', description: 'Person who paid (e.g. Papa, Self)' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        dueDate: { type: 'string', description: 'Due date if status is Pending, YYYY-MM-DD' }
      },
      required: ['category', 'description', 'amount']
    }
  },
  {
    name: 'add_shagun',
    description: 'Add a shagun/gift received from someone at the wedding.',
    input_schema: {
      type: 'object',
      properties: {
        giverName: { type: 'string', description: 'Who gave the shagun' },
        amount: { type: 'number', description: 'Amount in INR' },
        relationship: { type: 'string', description: 'Relationship (e.g. Mama, Chacha, Friend)' },
        side: { type: 'string', enum: ['Dulhan', 'Dulha', 'Both'] },
        mode: { type: 'string', enum: ['Cash', 'UPI', 'Cheque', 'Gift Item'] },
        giftItem: { type: 'string', description: 'If mode is Gift Item, what was given' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' }
      },
      required: ['giverName', 'amount']
    }
  },
  {
    name: 'add_lena',
    description: 'Add a receivable — money someone owes the user (paise jo humein milne hain).',
    input_schema: {
      type: 'object',
      properties: {
        person: { type: 'string', description: 'Person who owes money' },
        phone: { type: 'string' },
        amount: { type: 'number' },
        purpose: { type: 'string', description: 'Why — e.g. advance wapas, udhaar' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        dueDate: { type: 'string', description: 'YYYY-MM-DD' }
      },
      required: ['person', 'amount']
    }
  },
  {
    name: 'add_dena',
    description: 'Add a payable — money the user owes someone (paise jo humein dene hain).',
    input_schema: {
      type: 'object',
      properties: {
        person: { type: 'string', description: 'Person to whom money is owed' },
        phone: { type: 'string' },
        amount: { type: 'number' },
        purpose: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        dueDate: { type: 'string', description: 'YYYY-MM-DD' }
      },
      required: ['person', 'amount']
    }
  },
  {
    name: 'query_data',
    description: 'Look up specific information from the wedding data. Use for questions like "kitna X diya", "pending kya hai", etc.',
    input_schema: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: ['category_total', 'vendor_total', 'giver_total', 'pending_payments', 'summary', 'lena_pending', 'dena_pending']
        },
        filter: { type: 'string', description: 'Optional filter value (category name, vendor name, etc.)' }
      },
      required: ['query_type']
    }
  }
];
