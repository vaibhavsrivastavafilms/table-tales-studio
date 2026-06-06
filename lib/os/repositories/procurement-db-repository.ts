import type { ProcurementDb } from "@/lib/os/procurement/types";
import { createSeedDb } from "@/lib/os/procurement/seed";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AttendanceRepository } from "@/lib/os/repositories/expense-repository";
import {
  CreditNoteRepository,
  VendorLedgerRepository,
} from "@/lib/os/repositories/credit-note-repository";
import { BranchRepository } from "@/lib/os/repositories/branch-repository";
import { VendorRepository } from "@/lib/os/repositories/vendor-repository";
import { InventoryRepository } from "@/lib/os/repositories/inventory-repository";
import { RecipeRepository } from "@/lib/os/repositories/recipe-repository";
import { EmployeeRepository } from "@/lib/os/repositories/employee-repository";
import { PurchaseRepository } from "@/lib/os/repositories/purchase-repository";
import { SaleRepository } from "@/lib/os/repositories/sale-repository";
import { PayrollRepository } from "@/lib/os/repositories/payroll-repository";
import { MisRepository } from "@/lib/os/repositories/mis-repository";
import { ExpenseRepository } from "@/lib/os/repositories/expense-repository";
import {
  ExtensionRepository,
  mergeProcurementDb,
  splitProcurementDb,
} from "@/lib/os/repositories/extension-repository";

export class ProcurementDbRepository {
  async load(): Promise<ProcurementDb> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const [
      branchRepo,
      vendorRepo,
      inventoryRepo,
      recipeRepo,
      employeeRepo,
      purchaseRepo,
      saleRepo,
      payrollRepo,
      misRepo,
      expenseRepo,
      attendanceRepo,
      creditRepo,
      ledgerRepo,
      extensionRepo,
    ] = await Promise.all([
      BranchRepository.create(),
      VendorRepository.create(),
      InventoryRepository.create(),
      RecipeRepository.create(),
      EmployeeRepository.create(),
      PurchaseRepository.create(),
      SaleRepository.create(),
      PayrollRepository.create(),
      MisRepository.create(),
      ExpenseRepository.create(),
      AttendanceRepository.create(),
      CreditNoteRepository.create(),
      VendorLedgerRepository.create(),
      ExtensionRepository.create(),
    ]);

    const [
      branches,
      vendors,
      inventoryItems,
      inventoryMovements,
      openingStock,
      closingStock,
      categories,
      purchaseBills,
      grns,
      recipes,
      recipeIngredients,
      employees,
      attendanceRecords,
      sales,
      payrollRuns,
      payrollLines,
      operatingExpenses,
      creditNotes,
      vendorLedger,
      dailyMisReports,
      extensions,
    ] = await Promise.all([
      branchRepo.list(),
      vendorRepo.list(),
      inventoryRepo.listItems(),
      inventoryRepo.listMovements(),
      inventoryRepo.listOpeningStock(),
      inventoryRepo.listClosingStock(),
      inventoryRepo.listCategories(),
      purchaseRepo.listBills(),
      purchaseRepo.listGrns(),
      recipeRepo.listRecipes(),
      recipeRepo.listIngredients(),
      employeeRepo.list(),
      attendanceRepo.list(),
      saleRepo.list(),
      payrollRepo.listRuns(),
      payrollRepo.listLines(),
      expenseRepo.list(),
      creditRepo.list(),
      ledgerRepo.list(),
      misRepo.listDaily(),
      extensionRepo.load(),
    ]);

    const hasData =
      branches.length > 0 ||
      vendors.length > 0 ||
      inventoryItems.length > 0 ||
      purchaseBills.length > 0;

    if (!hasData) {
      return createSeedDb();
    }

    return mergeProcurementDb(
      {
        branches,
        vendors,
        inventoryItems,
        inventoryMovements,
        openingStock,
        closingStock,
        categories,
        purchaseBills,
        grns,
        recipes,
        recipeIngredients,
        employees,
        attendanceRecords,
        sales,
        payrollRuns,
        payrollLines,
        operatingExpenses,
        creditNotes,
        vendorLedger,
        dailyMisReports,
      },
      extensions
    );
  }

  async save(db: ProcurementDb): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const { normalized, extensions } = splitProcurementDb(db);

    const [
      branchRepo,
      vendorRepo,
      inventoryRepo,
      recipeRepo,
      employeeRepo,
      purchaseRepo,
      saleRepo,
      payrollRepo,
      misRepo,
      expenseRepo,
      attendanceRepo,
      creditRepo,
      ledgerRepo,
      extensionRepo,
    ] = await Promise.all([
      BranchRepository.create(),
      VendorRepository.create(),
      InventoryRepository.create(),
      RecipeRepository.create(),
      EmployeeRepository.create(),
      PurchaseRepository.create(),
      SaleRepository.create(),
      PayrollRepository.create(),
      MisRepository.create(),
      ExpenseRepository.create(),
      AttendanceRepository.create(),
      CreditNoteRepository.create(),
      VendorLedgerRepository.create(),
      ExtensionRepository.create(),
    ]);

    const itemIdMap = new Map(normalized.inventoryItems.map((i) => [i.id, i.id]));

    await branchRepo.saveAll(normalized.branches);
    await vendorRepo.saveAll(normalized.vendors);
    await inventoryRepo.saveCategories(normalized.categories);
    await inventoryRepo.saveItems(normalized.inventoryItems);
    await inventoryRepo.saveMovements(normalized.inventoryMovements, itemIdMap);
    await recipeRepo.saveAll(normalized.recipes, normalized.recipeIngredients);
    await employeeRepo.saveAll(normalized.employees);
    await purchaseRepo.saveBills(normalized.purchaseBills);
    await purchaseRepo.saveGrns(normalized.grns);
    await saleRepo.saveAll(normalized.sales);
    await payrollRepo.saveAll(normalized.payrollRuns, normalized.payrollLines);
    await expenseRepo.saveAll(normalized.operatingExpenses);
    await attendanceRepo.saveAll(normalized.attendanceRecords);
    await creditRepo.saveAll(normalized.creditNotes);
    await ledgerRepo.saveAll(normalized.vendorLedger);
    await misRepo.saveAll(normalized.dailyMisReports);
    await extensionRepo.save(extensions);
  }
}

export const procurementDbRepository = new ProcurementDbRepository();
