import { useEffect, FC } from 'react';
import { MainLayout } from './components/layout';
import { TallyBanner } from './components/dashboard/TallyBanner';
import { MeterSalesCard } from './components/dashboard/MeterSalesCard';
import { CashCollectionCard } from './components/dashboard/CashCollectionCard';
import { ActionToolbar } from './components/dashboard/ActionToolbar';
import { ShiftHistoryTable } from './components/history/ShiftHistoryTable';
import { ConfirmShiftModal, SettingsModal, DeleteConfirmModal } from './components/modals';
import { Toast } from './components/common/Toast';
import { useShiftStore } from './stores/shiftStore';

export const App: FC = () => {
  const loadInitialData = useShiftStore((state) => state.loadInitialData);

  // Load persistent records & fuel rates on initial app mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <MainLayout>
      {/* 1. Live Real-Time Tally Variance Summary Banner */}
      <TallyBanner />

      {/* 2. Interactive Two-Column Calculation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MeterSalesCard />
        <CashCollectionCard />
      </div>

      {/* 3. Action Toolbar (Reset & Commit CTAs) */}
      <ActionToolbar />

      {/* 4. Shift Logs & Audit Ledger Section */}
      <ShiftHistoryTable />

      {/* 5. Interactive Overlays & Modals */}
      <ConfirmShiftModal />
      <SettingsModal />
      <DeleteConfirmModal />

      {/* 6. User Feedback Toast Notifications */}
      <Toast />
    </MainLayout>
  );
};

export default App;
