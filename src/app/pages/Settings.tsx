import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrokerCredentialsForm from "../../features/options/components/options/BrokerCredentialsForm";
import ExportCapabilitiesButton from "../../shared/components/ExportCapabilitiesButton";
import EnhancedConfigurationPanel, {
  ConfigurationOption,
} from "../../shared/components/ui/EnhancedConfigurationPanel";
import { AccountService } from "../../shared/services/AccountService";
import NavigationController from "../../shared/utils/navigation/NavigationController";
import { UserExperienceLevel } from "../../shared/utils/ux/UXLayersController";
import { Account, AccountType } from "../../types/account";

import {
  loadSetting,
  saveSetting,
} from "../../shared/services/SettingsService";

const Settings: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showDirectImport, setShowDirectImport] = useState(false);
  const [showHelpPage, setShowHelpPage] = useState(true);
  const [showRuleEngine, setShowRuleEngine] = useState(false);
  const [showUnifiedDashboard, setShowUnifiedDashboard] = useState(false);
  const [showLegacyDashboard, setShowLegacyDashboard] = useState(false);
  const [enableAdvancedFeatures, setEnableAdvancedFeatures] = useState(false);
  const [enableDebugMode, setEnableDebugMode] = useState(false);
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>("import");

  // Load accounts on component mount
  useEffect(() => {
    const loadedAccounts = AccountService.getAccounts();
    setAccounts(loadedAccounts);

    if (loadedAccounts.length > 0) {
      setSelectedAccount(loadedAccounts[0]);
    }
  }, []);

  useEffect(() => {
    setShowImport(loadSetting("showImport") === "true");
    setShowDirectImport(loadSetting("showDirectImport") === "true");
    setShowHelpPage(loadSetting("showHelpPage") !== "false"); // Default to true
    setShowRuleEngine(loadSetting("showRuleEngine") === "true"); // Changed to default false
    setShowUnifiedDashboard(loadSetting("showUnifiedDashboard") === "true"); // Changed to default false
    setShowLegacyDashboard(loadSetting("showLegacyDashboard") === "true"); // Default to false
    setEnableAdvancedFeatures(loadSetting("enableAdvancedFeatures") === "true");
    setEnableDebugMode(loadSetting("enableDebugMode") === "true");
  }, []);

  // Handle account field updates
  const handleAccountUpdate = (field: keyof Account, value: any) => {
    if (!selectedAccount) return;

    const updatedAccount = {
      ...selectedAccount,
      [field]: value,
    };

    setSelectedAccount(updatedAccount);

    // Save to storage
    AccountService.updateAccount(updatedAccount);

    // Update accounts list
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) =>
        acc.id === updatedAccount.id ? updatedAccount : acc
      )
    );
  };

  // Handle account selection change
  const handleAccountSelectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const accountId = e.target.value;
    const account = accounts.find((a) => a.id === accountId);

    if (account) {
      setSelectedAccount(account);
    }
  };

  // Handle creating a new account
  const handleCreateAccount = () => {
    const newAccount: Account = {
      id: `account-${Date.now()}`,
      name: "New Account",
      type: AccountType.CASH,
      balance: 0,
      lastUpdated: new Date(),
      monthlyDeposit: 100,
      created: new Date(),
    };

    AccountService.addAccount(newAccount);

    // Refresh accounts list
    const updatedAccounts = AccountService.getAccounts();
    setAccounts(updatedAccounts);
    setSelectedAccount(newAccount);
  };

  // Handle deleting an account
  const handleDeleteAccount = () => {
    if (!selectedAccount) return;

    if (
      window.confirm(
        `Are you sure you want to delete account "${selectedAccount.name}"?`
      )
    ) {
      AccountService.deleteAccount(selectedAccount.id);

      // Refresh accounts list
      const updatedAccounts = AccountService.getAccounts();
      setAccounts(updatedAccounts);

      // Select first account if available, or null if no accounts left
      setSelectedAccount(
        updatedAccounts.length > 0 ? updatedAccounts[0] : null
      );
    }
  };

  // Enhanced configuration options
  const configOptions: ConfigurationOption[] = React.useMemo(
    () => [
      // BASIC LEVEL (2 options)
      {
        id: "showHelpPage",
        label: "Show Help Page",
        type: "toggle",
        value: showHelpPage,
        category: "basic",
        priority: 1,
        description: "Show or hide the help page in the navigation.",
      },
      {
        id: "showImport",
        label: "Show IBKR Import Page",
        type: "toggle",
        value: showImport,
        category: "basic",
        priority: 2,
        description: "Show or hide the IBKR import page in the navigation.",
      },

      // INTERMEDIATE LEVEL (3 additional options)
      {
        id: "showDirectImport",
        label: "Show Direct CSV Import",
        type: "toggle",
        value: showDirectImport,
        category: "import",
        priority: 3,
        description: "Show or hide the direct CSV import page.",
      },
      {
        id: "showRuleEngine",
        label: "Show Rule Engine Demo",
        type: "toggle",
        value: showRuleEngine,
        category: "import",
        priority: 4,
        description: "Show or hide the rule engine demo page.",
      },
      {
        id: "showUnifiedDashboard",
        label: "Show Unified Dashboard",
        type: "toggle",
        value: showUnifiedDashboard,
        category: "import",
        priority: 5,
        description: "Show or hide the unified dashboard in the navigation.",
      },
      {
        id: "showLegacyDashboard",
        label: "Show Legacy Dashboard",
        type: "toggle",
        value: showLegacyDashboard,
        category: "import",
        priority: 6,
        description: "Show or hide the legacy dashboard in the navigation.",
      },

      // ADVANCED LEVEL (everything else)
      {
        id: "enableAdvancedFeatures",
        label: "Advanced Trading Features",
        type: "toggle",
        value: enableAdvancedFeatures,
        category: "broker",
        priority: 7,
        description: "Enable advanced trading features and calculations.",
      },
      {
        id: "enableDebugMode",
        label: "Debug Mode",
        type: "toggle",
        value: enableDebugMode,
        category: "broker",
        priority: 8,
        description: "Enable debug mode for troubleshooting and development.",
      },
    ],
    [
      showHelpPage,
      showImport,
      showDirectImport,
      showRuleEngine,
      showUnifiedDashboard,
      showLegacyDashboard,
      enableAdvancedFeatures,
      enableDebugMode,
    ]
  );

  const handleConfigOptionChange = (optionId: string, value: any) => {
    // Save to storage and update state
    saveSetting(optionId, value ? "true" : "false");

    if (optionId === "showImport") setShowImport(value);
    if (optionId === "showDirectImport") setShowDirectImport(value);
    if (optionId === "showHelpPage") setShowHelpPage(value);
    if (optionId === "showRuleEngine") setShowRuleEngine(value);
    if (optionId === "showUnifiedDashboard") setShowUnifiedDashboard(value);
    if (optionId === "showLegacyDashboard") setShowLegacyDashboard(value);
    if (optionId === "enableAdvancedFeatures") setEnableAdvancedFeatures(value);
    if (optionId === "enableDebugMode") setEnableDebugMode(value);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Enhanced Configuration Panel at the top */}
      <EnhancedConfigurationPanel
        title="Quick Configuration"
        options={configOptions}
        onOptionChange={handleConfigOptionChange}
        userLevel={userLevel}
        position="top"
        showLevelSelector={true}
        onUserLevelChange={setUserLevel}
        className="mb-8"
      />

      {/* Hidden/Advanced Pages Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-xl font-medium text-gray-800 mb-4">
          Advanced & Diagnostic Pages
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          These pages are hidden from the main navigation but can be accessed
          directly:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const navigationController = new NavigationController(userLevel);
            const hiddenItems = navigationController.getHiddenNavigationItems();
            const enabledDebugItems =
              navigationController.getEnabledDebugNavigationItems();
            const allItems = [...hiddenItems, ...enabledDebugItems];

            return allItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className="block p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">
                  {item.label}
                </div>
                <div className="text-sm text-gray-600">{item.description}</div>
              </Link>
            ));
          })()}
        </div>
        {(() => {
          const navigationController = new NavigationController(userLevel);
          const hiddenItems = navigationController.getHiddenNavigationItems();
          const enabledDebugItems =
            navigationController.getEnabledDebugNavigationItems();
          const allItems = [...hiddenItems, ...enabledDebugItems];
          return (
            allItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>
                  No advanced pages available for your current experience level.
                </p>
                <p className="text-sm mt-1">
                  Switch to a higher level to access more features.
                </p>
              </div>
            )
          );
        })()}
      </div>

      {/* Broker Credentials Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <BrokerCredentialsForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Settings */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 mb-4">
              Account Settings
            </h2>

            {/* Account Selector */}
            <div className="mb-6 flex items-end gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Account
                </label>
                <select
                  value={selectedAccount?.id || ""}
                  onChange={handleAccountSelectionChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Account
              </button>
            </div>

            {selectedAccount ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={selectedAccount.name}
                    onChange={(e) =>
                      handleAccountUpdate("name", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <select
                    value={selectedAccount.type}
                    onChange={(e) =>
                      handleAccountUpdate("type", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value={AccountType.CASH}>Cash</option>
                    <option value={AccountType.IBKR}>
                      Interactive Brokers
                    </option>
                    <option value={AccountType.NINJA_TRADER}>
                      NinjaTrader
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Balance
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={selectedAccount.balance}
                      onChange={(e) =>
                        handleAccountUpdate("balance", Number(e.target.value))
                      }
                      className="w-full pl-7 p-2 border border-gray-300 rounded"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Deposit Amount
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={selectedAccount.monthlyDeposit || 0}
                      onChange={(e) =>
                        handleAccountUpdate(
                          "monthlyDeposit",
                          Number(e.target.value)
                        )
                      }
                      className="w-full pl-7 p-2 border border-gray-300 rounded"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used for projecting future account balances
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p>No accounts found. Click "Add Account" to create one.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Settings */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 mb-4">
              System Settings
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Current Version
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Version: April 2025 Release
                </p>
                <p className="text-sm text-gray-600">
                  Last Updated: April 30, 2025
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Import Capabilities
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  The application supports two methods for importing IBKR data:
                </p>
                <ul className="text-sm text-gray-600 list-disc pl-5 mb-4">
                  <li>Fixed Import - For standard IBKR activity statements</li>
                  <li>Direct Parser - For specialized IBKR CSV formats</li>
                </ul>
                <div className="space-y-2">
                  <Link
                    to="/import/fixed-import"
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                  >
                    Go to Fixed Import
                  </Link>
                  <Link
                    to="/import/direct"
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                  >
                    Go to Direct Parser
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Capabilities Export
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Export the current capabilities and configuration of your
                  Trading Helper Bot.
                </p>
                <ExportCapabilitiesButton className="w-full" />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Development & Planning
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Track development progress, upcoming features, and project
                  roadmap.
                </p>
                <Link
                  to="/work-items"
                  className="block w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
                >
                  View Work Items & Roadmap
                </Link>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Data Management
                </h3>
                <div className="space-y-2">
                  <button
                    className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      if (
                        window.confirm(
                          "This will download all your data as a backup file. Continue?"
                        )
                      ) {
                        alert(
                          "Backup functionality will be available in a future update."
                        );
                      }
                    }}
                  >
                    Backup Data
                  </button>

                  <button
                    className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      if (
                        window.confirm(
                          "This will restore your data from a backup file. Current data will be overwritten. Continue?"
                        )
                      ) {
                        alert(
                          "Restore functionality will be available in a future update."
                        );
                      }
                    }}
                  >
                    Restore Data
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Application Information
                </h3>
                <div className="text-sm text-gray-600">
                  <p>Version: April 2025 Release</p>
                  <p>Last Updated: April 30, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
