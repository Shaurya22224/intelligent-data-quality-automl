import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ErrorAlert } from './components/common/ErrorAlert';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { QualityReportPage } from './pages/QualityReportPage';
import { PreprocessingPage } from './pages/PreprocessingPage';
import { AutoMLPage } from './pages/AutoMLPage';
import { HistoryPage } from './pages/HistoryPage';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    isLoading, 
    error, 
    notification, 
    clearError, 
    setNotification 
  } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'upload':
        return <UploadPage />;
      case 'quality':
        return <QualityReportPage />;
      case 'preprocessing':
        return <PreprocessingPage />;
      case 'automl':
        return <AutoMLPage />;
      case 'history':
        return <HistoryPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {renderActivePage()}
      </main>

      <Footer />

      <ErrorAlert
        error={error}
        notification={notification}
        onClearError={clearError}
        onClearNotification={() => setNotification(null)}
      />

      {isLoading && <LoadingSpinner fullPage />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
