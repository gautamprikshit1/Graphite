import { type DialogState } from "@graphite/state-providers/dialog";
import { browserVersion, operatingSystem } from "@graphite/utility-functions/platform";
import { stripIndents } from "@graphite/utility-functions/strip-indents";
import { type Editor } from "@graphite/wasm-communication/editor";
import { DisplayDialogPanic } from "@graphite/wasm-communication/messages";

export function createPanicManager(editor: Editor, dialogState: DialogState): void {
	// Code panic dialog and console error
	editor.subscriptions.subscribeJsMessage(DisplayDialogPanic, (displayDialogPanic) => {
		// `Error.stackTraceLimit` is only available in V8/Chromium
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(Error as any).stackTraceLimit = Infinity;
		const stackTrace = new Error().stack || "";
		const panicDetails = `${displayDialogPanic.panicInfo}${stackTrace ? `\n\n${stackTrace}` : ""}`;

		// eslint-disable-next-line no-console
		console.error(panicDetails);

		dialogState.createCrashDialog(panicDetails);
	});
}

export function githubUrl(panicDetails: string): string {
	const url = new URL("https://github.com/GraphiteEditor/Graphite/issues/new");

	let body = stripIndents`
		**Describe the Crash**
		Explain clearly what you were doing when the crash occurred.

		**Steps To Reproduce**
		Describe precisely how the crash occurred, step by step, starting with a new editor window.
		1. Open the Graphite editor at https://editor.graphite.rs
		2. 
		3. 
		4. 
		5. 

		**Additional Details**
		Provide any further information or context that you think would be helpful in fixing the issue. Screenshots or video can be linked or attached to this issue.

		**Browser and OS**
		${browserVersion()}, ${operatingSystem(true).replace("Unknown", "YOUR OPERATING SYSTEM")}

		**Stack Trace**
		Copied from the crash dialog in the Graphite editor:
	`;

	body += "\n\n```\n";
	body += panicDetails.trimEnd();
	body += "\n```";

	const fields = {
		title: "[Crash Report] ",
		body,
		labels: ["Crash"].join(","),
		projects: [].join(","),
		milestone: "",
		assignee: "",
		template: "",
	};

	Object.entries(fields).forEach(([field, value]) => {
		if (value) url.searchParams.set(field, value);
	});

	return url.toString();
}
