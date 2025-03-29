import { initTabStoreData, TabModel, TabStoreData } from "./models/tabs";
import { Interaction } from "./models/interactions";
import { Workspace, WorkspaceModel } from "./models/workspaces";
import { dependencies } from "./base/dependencies";
import { DatabaseService } from "./services/database-service";
import { KeyStoreService } from "./services/keystore-service";
import { ShortcutService } from "./services/shortcut-service";
import { Kernel } from "./kernel";
import { createModel } from "./ext/llm";
import { appendEl, createEl } from "./utils/dom";
import { registerGlobalShortcuts } from "./global-shortcuts";
import { ModalService } from "./services/modal-service";
import "./ui/common/styles/global.css";
import "./ui/common/styles/reset.css";
import "./ui/common/styles/markdown.css";
import "./ui/modals/global";
import "./ui/app-root";

/* Initialize databases & stores */

const workspaceDatabaseService = new DatabaseService<string, Workspace>(
  "workspaces",
);
const interactionDatabaseService = new DatabaseService<string, Interaction>(
  "interactions",
);
const tabKeyStore = new KeyStoreService<TabStoreData>("tabs", initTabStoreData);

/* Initialize models */

const workspaceModel = new WorkspaceModel(
  workspaceDatabaseService,
  interactionDatabaseService,
);
const tabModel = new TabModel(tabKeyStore, workspaceModel);

/* Initialize kernel & LLMs */

const kernel = new Kernel({ model: createModel(), workspaceModel });

/* Initialize services */

const shortcutService = new ShortcutService();
const modalService = new ModalService();

/* Register dependencies */

dependencies.registerSingleton("WorkspaceModel", workspaceModel);
dependencies.registerSingleton("TabModel", tabModel);
dependencies.registerSingleton("Kernel", kernel);
dependencies.registerSingleton("ShortcutService", shortcutService);
dependencies.registerSingleton("ModalService", modalService);

/* Register global modals */

modalService.register("settings", {
  title: "Settings",
  element: "settings-modal",
});

/* Register keyboard shortcuts */

registerGlobalShortcuts();

/* Initialize UI */

appendEl(document.body, createEl("app-root"));
