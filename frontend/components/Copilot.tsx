"use client";

import { useMutation } from "@tanstack/react-query";
import { Robot, PaperPlaneTilt, User } from "@phosphor-icons/react";
import { useState } from "react";
import { askCopilot } from "@/lib/api";
import { Card, Pill, Button } from "@/components/ui";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Message {
  role: "operator" | "copilot";
  content: string;
}

const prompts = [
  "Why is Kaloor crowded?",
  "Summarize network health.",
  "Which station needs attention?",
  "Explain current recommendations.",
];

export function Copilot() {
  const [input, setInput] = useState("Which station needs attention?");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "copilot",
      content:
        "I can explain the current digital twin, recommendations, alerts, and simulations using only supplied operations data.",
    },
  ]);

  const mutation = useMutation({
    mutationFn: askCopilot,
    onSuccess: (data) => {
      setMessages((current) => [...current, { role: "copilot", content: data.answer }]);
    },
    onError: () => {
      setMessages((current) => [
        ...current,
        {
          role: "copilot",
          content:
            "Copilot is unavailable. Backend state can still be inspected from the dashboard.",
        },
      ]);
    },
  });

  function send(message = input) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { role: "operator", content: trimmed }]);
    setInput("");
    mutation.mutate(trimmed);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") send();
  };

  return (
    <ScrollReveal>
      <Card className="max-w-4xl mx-auto">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-2.5 text-[#111]">
              <Robot size={20} weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-[#111]">AI operations copilot</h2>
              <p className="text-sm text-[#787774] text-pretty">
                Explanation layer for current digital twin state
              </p>
            </div>
          </div>
          <Pill variant="green">Fact-bound</Pill>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              className="rounded-md border border-[#EAEAEA] px-3 py-2 text-sm text-[#787774] transition-all duration-200 hover:border-[#111] hover:text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="h-[420px] space-y-4 overflow-y-auto rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={message.role === "operator" ? "ml-auto max-w-[78%]" : "max-w-[82%]"}
            >
              <div
                className={
                  message.role === "operator"
                    ? "rounded-md bg-[#EAEAEA] p-4 text-[#111]"
                    : "rounded-md border border-[#EAEAEA] bg-white p-4 text-[#111]"
                }
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-[#787774]">
                  {message.role === "operator" ? <User size={14} /> : <Robot size={14} />}
                  {message.role}
                </div>
                <p className="whitespace-pre-wrap leading-7 text-pretty">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 rounded-md border border-[#EAEAEA] bg-white px-4 py-3 text-sm text-[#111] outline-none transition-all duration-200 focus:border-[#111]"
            placeholder="Ask about alerts, predictions, or recommendations"
          />
          <Button variant="primary" onClick={() => send()}>
            <PaperPlaneTilt size={16} weight="bold" />
            Send
          </Button>
        </div>
      </Card>
    </ScrollReveal>
  );
}
