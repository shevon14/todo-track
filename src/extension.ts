import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const COMMENT_TYPES = [
  "TODO",
  "FIXME",
  "OPTIMIZE",
  "REFACTOR",
  "REVIEW",
  "DEBUG",
  "NOTE",
  "DEPRECATED",
];

const FILE_TYPES = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "html",
  "css",
  "scss",
  "json",
  "py",
  "java",
  "dart",
  "php",
  "rb",
  "cs",
  "go",
  "rs",
];


const CONFIG_FILE = ".todo.json";

// ensure .todo.json exists with default values
function ensureConfigFile(): void {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceFolder) {return;}

  const configPath = path.join(workspaceFolder, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      commentTypes: COMMENT_TYPES,
      fileTypes: FILE_TYPES,
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }
}

// load config
function loadConfig() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceFolder)
    {return {
      commentTypes: COMMENT_TYPES,
      fileTypes: FILE_TYPES,
    };}

  const configPath = path.join(workspaceFolder, CONFIG_FILE);
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
      vscode.window.showErrorMessage("Error reading .todo.json");
    }
  }
  return { commentTypes: COMMENT_TYPES, fileTypes: FILE_TYPES };
}

// scan the project for comments
async function scanProjectForComments(): Promise<
  { type: string; file: string; line: number; text: string }[]
> {
  ensureConfigFile();
  const config = loadConfig();
  const results: { type: string; file: string; line: number; text: string }[] =
    [];

  const filePattern = `**/*.{${config.fileTypes.join(",")}}`;
  const files = await vscode.workspace.findFiles(
    filePattern,
    "**/{node_modules,.git,dist,build,out,coverage,logs,vendor}/**"
  );

  if (files.length === 0) {
    vscode.window.showInformationMessage(
      "⚠️ No matching files found! Check workspace folder."
    );
    return results;
  }

  const commentPattern = config.commentTypes.join("|");
  const regex = new RegExp(`(\\/\\/\\s*(${commentPattern})\\b:?.*)`, "gi");

  const fileScanPromises = files.map(async (file) => {
    const document = await vscode.workspace.openTextDocument(file);
    const text = document.getText();
    let match;
  
    while ((match = regex.exec(text)) !== null) {
      const line = document.positionAt(match.index).line + 1;
      results.push({
        type: match[2].toUpperCase(),
        file: file.fsPath,
        line: line,
        text: match[1],
      });
    }
  });
  
  await Promise.all(fileScanPromises);
  
  return results;
}

async function scanFileForComments(filePath: string) {
  const results: { type: string; file: string; line: number; text: string }[] =
    [];

  const config = loadConfig();
  const commentPattern = config.commentTypes.join("|");
  const regex = new RegExp(`(\\/\\/\\s*(${commentPattern})\\b:?.*)`, "gi");

  try {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    let match;

    while ((match = regex.exec(text)) !== null) {
      const line = document.positionAt(match.index).line + 1;
      results.push({
        type: match[2].toUpperCase(),
        file: filePath,
        line: line,
        text: match[1],
      });
    }
  } catch (error) {
    console.error("Error scanning file:", error);
  }

  return results;
}

// Tree View Provider
class TodoTreeViewProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    void | vscode.TreeItem | null | undefined
  > = new vscode.EventEmitter<void | vscode.TreeItem | null | undefined>();
  readonly onDidChangeTreeData: vscode.Event<
    void | vscode.TreeItem | null | undefined
  > = this._onDidChangeTreeData.event;

  private results: {
    type: string;
    file: string;
    line: number;
    text: string;
  }[] = [];
  private loading: boolean = true; // new loading state

  constructor() {
    this.refresh();
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.uri.scheme === "file") {
        this.refresh(document.uri.fsPath); // only re scan saved file
      }
    });
  }

  async refresh(savedFilePath?: string) {
    // loading indicator for full scan
    if (!savedFilePath) {
      this.loading = true;
      this._onDidChangeTreeData.fire();

      this.results = await scanProjectForComments();
      this.loading = false;
    } else {
      const newResults = await scanFileForComments(savedFilePath);
      this.results = this.results
        .filter((r) => r.file !== savedFilePath)
        .concat(newResults);
    }

    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (this.loading) {
      return [new vscode.TreeItem("🔍 Scanning...")];
    }

    if (!element) {
      const config = loadConfig();
      return config.commentTypes
        .map((type: string) => {
          const item = new vscode.TreeItem(
            type.toUpperCase(),
            vscode.TreeItemCollapsibleState.Collapsed
          );
          return item;
        })
        .filter((item: { label: string }) =>
          this.results.some((result) => result.type === item.label)
        );
    }

    const type = element.label as string;
    return this.results
      .filter((result) => result.type === type)
      .map((result) => {
        const fileName = result.file.split("/").pop() || "unknown";
        const relativePath = vscode.workspace.asRelativePath(result.file);

        const item = new vscode.TreeItem(
          fileName,
          vscode.TreeItemCollapsibleState.None
        );
        item.description = relativePath;
        item.tooltip = `${result.text} (Line ${result.line})`;

        item.command = {
          command: "todo-track.openFileAtLine",
          title: "Open File at Line",
          arguments: [result.file, result.line],
        };

        return item;
      });
  }
}

// Register the Todo Track view
export function activate(context: vscode.ExtensionContext) {
  ensureConfigFile();
  const provider = new TodoTreeViewProvider();
  vscode.window.registerTreeDataProvider("todoTrackView", provider);

  const openFileCommand = vscode.commands.registerCommand(
    "todo-track.openFileAtLine",
    async (file: string, line: number) => {
      const document = await vscode.workspace.openTextDocument(file);
      const editor = await vscode.window.showTextDocument(document);
      const position = new vscode.Position(line - 1, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    }
  );

  const refreshCommand = vscode.commands.registerCommand(
    "todo-track.refresh",
    () => {
      provider.refresh();
    }
  );

  context.subscriptions.push(openFileCommand, refreshCommand);
}

export function deactivate() {}
