/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddFunds from './pages/AddFunds';
import AdminPanel from './pages/AdminPanel';
import BalanceManagement from './pages/BalanceManagement';
import ContactUs from './pages/ContactUs';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ImageGenerationCenter from './pages/ImageGenerationCenter';
import ImportServices from './pages/ImportServices';
import ManageAPIIntegration from './pages/ManageAPIIntegration';
import ManageAPILogs from './pages/ManageAPILogs';
import ManageAPIProviders from './pages/ManageAPIProviders';
import ManageAnnouncements from './pages/ManageAnnouncements';
import ManageContactChannels from './pages/ManageContactChannels';
import ManageDeposits from './pages/ManageDeposits';
import ManageOrders from './pages/ManageOrders';
import ManagePaymentMethods from './pages/ManagePaymentMethods';
import ManagePricingSettings from './pages/ManagePricingSettings';
import ManageServiceClassifier from './pages/ManageServiceClassifier';
import ManageServices from './pages/ManageServices';
import ManageSupportFiles from './pages/ManageSupportFiles';
import ManageTheme from './pages/ManageTheme';
import ManageTierPricing from './pages/ManageTierPricing';
import ManageUserTiers from './pages/ManageUserTiers';
import ManageUsers from './pages/ManageUsers';
import OrderService from './pages/OrderService';
import Orders from './pages/Orders';
import Services from './pages/Services';
import ServicesSyncDashboard from './pages/ServicesSyncDashboard';
import SupportFiles from './pages/SupportFiles';
import SupportTickets from './pages/SupportTickets';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddFunds": AddFunds,
    "AdminPanel": AdminPanel,
    "BalanceManagement": BalanceManagement,
    "ContactUs": ContactUs,
    "Dashboard": Dashboard,
    "Home": Home,
    "ImageGenerationCenter": ImageGenerationCenter,
    "ImportServices": ImportServices,
    "ManageAPIIntegration": ManageAPIIntegration,
    "ManageAPILogs": ManageAPILogs,
    "ManageAPIProviders": ManageAPIProviders,
    "ManageAnnouncements": ManageAnnouncements,
    "ManageContactChannels": ManageContactChannels,
    "ManageDeposits": ManageDeposits,
    "ManageOrders": ManageOrders,
    "ManagePaymentMethods": ManagePaymentMethods,
    "ManagePricingSettings": ManagePricingSettings,
    "ManageServiceClassifier": ManageServiceClassifier,
    "ManageServices": ManageServices,
    "ManageSupportFiles": ManageSupportFiles,
    "ManageTheme": ManageTheme,
    "ManageTierPricing": ManageTierPricing,
    "ManageUserTiers": ManageUserTiers,
    "ManageUsers": ManageUsers,
    "OrderService": OrderService,
    "Orders": Orders,
    "Services": Services,
    "ServicesSyncDashboard": ServicesSyncDashboard,
    "SupportFiles": SupportFiles,
    "SupportTickets": SupportTickets,
}

export const pagesConfig = {
    mainPage: "Services",
    Pages: PAGES,
    Layout: __Layout,
};