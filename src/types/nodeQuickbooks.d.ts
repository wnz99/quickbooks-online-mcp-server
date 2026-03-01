declare module 'node-quickbooks' {
  type QBCallback<T = any> = (err: any, result: T, res?: any) => void;

  export default class QuickBooks {
    constructor(
      consumerKey: string,
      consumerSecret: string,
      accessToken: string,
      tokenSecret: boolean | string,
      realmId: string,
      useSandbox?: boolean,
      debug?: boolean,
      minorversion?: string | number | null,
      oauthVersion?: string,
      refreshToken?: string
    );

    // Account
    createAccount(account: object, callback: QBCallback): void;
    getAccount(id: string, callback: QBCallback): void;
    updateAccount(account: object, callback: QBCallback): void;
    findAccounts(options: object, callback: QBCallback): void;

    // Attachable
    createAttachable(attachable: object, callback: QBCallback): void;
    getAttachable(id: string, callback: QBCallback): void;
    updateAttachable(attachable: object, callback: QBCallback): void;
    deleteAttachable(idOrEntity: any, callback: QBCallback): void;
    findAttachables(options: object, callback: QBCallback): void;

    // Bill
    createBill(bill: object, callback: QBCallback): void;
    getBill(id: string, callback: QBCallback): void;
    updateBill(bill: object, callback: QBCallback): void;
    deleteBill(bill: object, callback: QBCallback): void;
    findBills(options: object, callback: QBCallback): void;

    // Bill Payment
    createBillPayment(billPayment: object, callback: QBCallback): void;
    getBillPayment(id: string, callback: QBCallback): void;
    updateBillPayment(billPayment: object, callback: QBCallback): void;
    deleteBillPayment(idOrEntity: any, callback: QBCallback): void;
    findBillPayments(options: object, callback: QBCallback): void;

    // Class
    createClass(classEntity: object, callback: QBCallback): void;
    getClass(id: string, callback: QBCallback): void;
    updateClass(classEntity: object, callback: QBCallback): void;
    findClasses(options: object, callback: QBCallback): void;

    // Company Info
    getCompanyInfo(id: string, callback: QBCallback): void;
    updateCompanyInfo(companyInfo: object, callback: QBCallback): void;

    // Credit Memo
    createCreditMemo(creditMemo: object, callback: QBCallback): void;
    getCreditMemo(id: string, callback: QBCallback): void;
    updateCreditMemo(creditMemo: object, callback: QBCallback): void;
    deleteCreditMemo(idOrEntity: any, callback: QBCallback): void;
    findCreditMemos(options: object, callback: QBCallback): void;

    // Customer
    createCustomer(customer: object, callback: QBCallback): void;
    getCustomer(id: string, callback: QBCallback): void;
    updateCustomer(customer: object, callback: QBCallback): void;
    deleteCustomer(idOrEntity: any, callback: QBCallback): void;
    findCustomers(options: object, callback: QBCallback): void;

    // Department
    createDepartment(department: object, callback: QBCallback): void;
    getDepartment(id: string, callback: QBCallback): void;
    updateDepartment(department: object, callback: QBCallback): void;
    findDepartments(options: object, callback: QBCallback): void;

    // Deposit
    createDeposit(deposit: object, callback: QBCallback): void;
    getDeposit(id: string, callback: QBCallback): void;
    updateDeposit(deposit: object, callback: QBCallback): void;
    deleteDeposit(idOrEntity: any, callback: QBCallback): void;
    findDeposits(options: object, callback: QBCallback): void;

    // Employee
    createEmployee(employee: object, callback: QBCallback): void;
    getEmployee(id: string, callback: QBCallback): void;
    updateEmployee(employee: object, callback: QBCallback): void;
    findEmployees(options: object, callback: QBCallback): void;

    // Estimate
    createEstimate(estimate: object, callback: QBCallback): void;
    getEstimate(id: string, callback: QBCallback): void;
    updateEstimate(estimate: object, callback: QBCallback): void;
    deleteEstimate(idOrEntity: any, callback: QBCallback): void;
    findEstimates(options: object, callback: QBCallback): void;

    // Exchange Rate
    getExchangeRate(id: string, callback: QBCallback): void;
    updateExchangeRate(exchangeRate: object, callback: QBCallback): void;

    // Invoice
    createInvoice(invoice: object, callback: QBCallback): void;
    getInvoice(id: string, callback: QBCallback): void;
    updateInvoice(invoice: object, callback: QBCallback): void;
    deleteInvoice(idOrEntity: any, callback: QBCallback): void;
    findInvoices(options: object, callback: QBCallback): void;

    // Item
    createItem(item: object, callback: QBCallback): void;
    getItem(id: string, callback: QBCallback): void;
    updateItem(item: object, callback: QBCallback): void;
    findItems(options: object, callback: QBCallback): void;

    // Journal Code
    createJournalCode(journalCode: object, callback: QBCallback): void;
    getJournalCode(id: string, callback: QBCallback): void;
    updateJournalCode(journalCode: object, callback: QBCallback): void;
    deleteJournalCode(idOrEntity: any, callback: QBCallback): void;
    findJournalCodes(options: object, callback: QBCallback): void;

    // Journal Entry
    createJournalEntry(journalEntry: object, callback: QBCallback): void;
    getJournalEntry(id: string, callback: QBCallback): void;
    updateJournalEntry(journalEntry: object, callback: QBCallback): void;
    deleteJournalEntry(idOrEntity: any, callback: QBCallback): void;
    findJournalEntries(options: object, callback: QBCallback): void;

    // Payment
    createPayment(payment: object, callback: QBCallback): void;
    getPayment(id: string, callback: QBCallback): void;
    updatePayment(payment: object, callback: QBCallback): void;
    deletePayment(idOrEntity: any, callback: QBCallback): void;
    findPayments(options: object, callback: QBCallback): void;

    // Payment Method
    createPaymentMethod(paymentMethod: object, callback: QBCallback): void;
    getPaymentMethod(id: string, callback: QBCallback): void;
    updatePaymentMethod(paymentMethod: object, callback: QBCallback): void;
    findPaymentMethods(options: object, callback: QBCallback): void;

    // Preferences
    getPreferences(callback: QBCallback): void;
    updatePreferences(preferences: object, callback: QBCallback): void;

    // Purchase
    createPurchase(purchase: object, callback: QBCallback): void;
    getPurchase(id: string, callback: QBCallback): void;
    updatePurchase(purchase: object, callback: QBCallback): void;
    deletePurchase(idOrEntity: any, callback: QBCallback): void;
    findPurchases(options: object, callback: QBCallback): void;

    // Purchase Order
    createPurchaseOrder(purchaseOrder: object, callback: QBCallback): void;
    getPurchaseOrder(id: string, callback: QBCallback): void;
    updatePurchaseOrder(purchaseOrder: object, callback: QBCallback): void;
    deletePurchaseOrder(idOrEntity: any, callback: QBCallback): void;
    findPurchaseOrders(options: object, callback: QBCallback): void;

    // Refund Receipt
    createRefundReceipt(refundReceipt: object, callback: QBCallback): void;
    getRefundReceipt(id: string, callback: QBCallback): void;
    updateRefundReceipt(refundReceipt: object, callback: QBCallback): void;
    deleteRefundReceipt(idOrEntity: any, callback: QBCallback): void;
    findRefundReceipts(options: object, callback: QBCallback): void;

    // Sales Receipt
    createSalesReceipt(salesReceipt: object, callback: QBCallback): void;
    getSalesReceipt(id: string, callback: QBCallback): void;
    updateSalesReceipt(salesReceipt: object, callback: QBCallback): void;
    deleteSalesReceipt(idOrEntity: any, callback: QBCallback): void;
    findSalesReceipts(options: object, callback: QBCallback): void;

    // Tax Agency
    createTaxAgency(taxAgency: object, callback: QBCallback): void;
    getTaxAgency(id: string, callback: QBCallback): void;
    updateTaxAgency(taxAgency: object, callback: QBCallback): void;
    findTaxAgencies(options: object, callback: QBCallback): void;

    // Tax Code
    getTaxCode(id: string, callback: QBCallback): void;
    updateTaxCode(taxCode: object, callback: QBCallback): void;
    findTaxCodes(options: object, callback: QBCallback): void;

    // Tax Rate
    getTaxRate(id: string, callback: QBCallback): void;
    updateTaxRate(taxRate: object, callback: QBCallback): void;
    findTaxRates(options: object, callback: QBCallback): void;

    // Term
    createTerm(term: object, callback: QBCallback): void;
    getTerm(id: string, callback: QBCallback): void;
    updateTerm(term: object, callback: QBCallback): void;
    findTerms(options: object, callback: QBCallback): void;

    // Time Activity
    createTimeActivity(timeActivity: object, callback: QBCallback): void;
    getTimeActivity(id: string, callback: QBCallback): void;
    updateTimeActivity(timeActivity: object, callback: QBCallback): void;
    deleteTimeActivity(idOrEntity: any, callback: QBCallback): void;
    findTimeActivities(options: object, callback: QBCallback): void;

    // Transfer
    createTransfer(transfer: object, callback: QBCallback): void;
    updateTransfer(transfer: object, callback: QBCallback): void;
    deleteTransfer(idOrEntity: any, callback: QBCallback): void;
    findTransfers(options: object, callback: QBCallback): void;

    // Vendor
    createVendor(vendor: object, callback: QBCallback): void;
    getVendor(id: string, callback: QBCallback): void;
    updateVendor(vendor: object, callback: QBCallback): void;
    deleteVendor(vendor: object, callback: QBCallback): void;
    findVendors(options: object, callback: QBCallback): void;

    // Vendor Credit
    createVendorCredit(vendorCredit: object, callback: QBCallback): void;
    getVendorCredit(id: string, callback: QBCallback): void;
    updateVendorCredit(vendorCredit: object, callback: QBCallback): void;
    deleteVendorCredit(idOrEntity: any, callback: QBCallback): void;
    findVendorCredits(options: object, callback: QBCallback): void;

    // Reports (dynamic method names: report{ReportType})
    [key: `report${string}`]: (options: object, callback: QBCallback) => void;
  }
}
