import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock, textContent } from "./CodeBlock";

const components: Components = {
	pre: ({ children }) => {
		const child = Array.isArray(children) ? children[0] : children;
		const className =
			(child as { props?: { className?: string } } | undefined)?.props?.className ?? "";
		const language = /language-(\S+)/.exec(className)?.[1];
		return <CodeBlock language={language} code={textContent(children).replace(/\n$/, "")} />;
	},
	a: ({ href, children }) => (
		<a href={href} target="_blank" rel="noopener noreferrer nofollow">
			{children}
		</a>
	),
};

/**
 * Model output is untrusted. react-markdown never renders raw HTML unless a
 * rehype-raw plugin is added, so HTML in a reply is shown as text, not executed.
 */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
	return (
		<div className="prose-chat">
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
				{text}
			</ReactMarkdown>
		</div>
	);
});
