"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BellRing,
  Calendar,
  Loader2,
  AlertTriangle,
  Check,
  History,
} from "lucide-react";
import type { Lembrete, Lead } from "@prisma/client";
import CollapsibleCard from "./CollapsibleCard";

type ReminderWithLead = Lembrete & {
  lead: {
    id: number;
    nomeDevedor: string;
  };
};

export default function UpcomingReminders() {
  const [reminders, setReminders] = useState<ReminderWithLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchReminders = async () => {
    if (reminders.length === 0) setIsLoading(true);
    try {
      const response = await fetch("/api/lembretes/upcoming");
      if (!response.ok) throw new Error("Falha ao carregar lembretes");
      const data = await response.json();
      setReminders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAction = async (
    reminderId: number,
    action: "complete" | "snooze"
  ) => {
    setBusyId(reminderId);
    try {
      let body = {};
      if (action === "complete") {
        body = { concluido: true };
      } else if (action === "snooze") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        body = { data: tomorrow.toISOString() };
      }

      const response = await fetch(`/api/lembretes/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Falha ao atualizar lembrete");
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (error) {
      console.error(`Erro ao ${action} o lembrete`, error);
      fetchReminders();
    } finally {
      setBusyId(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-4">
          <Loader2 className="mx-auto animate-spin text-gray-400" />
        </div>
      );
    }

    if (reminders.length === 0) {
      return (
        <p className="text-gray-400 px-2 py-4 text-center">
          Nenhum lembrete pendente. Bom trabalho!
        </p>
      );
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return (
      // --- MUDANÇA APLICADA AQUI: Adicionado xl:grid-cols-4 ---
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reminders.map((reminder) => {
          const reminderDate = new Date(reminder.data);
          const isOverdue = reminderDate < now;
          const isToday =
            reminderDate.toDateString() === new Date().toDateString();

          let borderColor = "border-transparent";
          if (isOverdue) borderColor = "border-red-500";
          else if (isToday) borderColor = "border-yellow-500";

          return (
            <div
              key={reminder.id}
              className={`bg-gray-700/50 p-3 rounded-lg border-l-4 ${borderColor} flex flex-col justify-between transition-opacity ${
                busyId === reminder.id ? "opacity-50" : ""
              }`}
            >
              <div>
                <Link
                  href={`/leads/${reminder.lead.id}`}
                  className="block rounded-lg mb-2"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white pr-2 text-sm">
                      {reminder.descricao}
                    </p>
                    {(isOverdue || isToday) && (
                      <AlertTriangle
                        size={16}
                        className={
                          isOverdue ? "text-red-500" : "text-yellow-500"
                        }
                      />
                    )}
                  </div>
                  <div className="text-xs text-blue-400 font-semibold mt-1">
                    {reminder.lead.nomeDevedor}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Calendar size={14} />
                    <span>
                      {new Date(reminder.data).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-600/50">
                {busyId === reminder.id ? (
                  <div className="w-full flex justify-center">
                    <Loader2 className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction(reminder.id, "complete")}
                      className="flex-1 text-xs bg-green-600/80 hover:bg-green-600 text-white font-bold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check size={14} /> Concluir
                    </button>
                    <button
                      onClick={() => handleAction(reminder.id, "snooze")}
                      className="flex-1 text-xs bg-yellow-600/80 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <History size={14} /> Adiar 1 Dia
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const alertCount = reminders.filter((r) => {
    const reminderDate = new Date(r.data);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (
      !r.concluido &&
      (reminderDate < now ||
        reminderDate.toDateString() === new Date().toDateString())
    );
  }).length;

  return (
    <div className="mb-6">
      <CollapsibleCard
        title={
          <div className="flex items-center gap-3">
            <BellRing />
            <span>Próximos Lembretes</span>
            {alertCount > 0 && !isLoading && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {alertCount}
              </span>
            )}
          </div>
        }
      >
        {renderContent()}
      </CollapsibleCard>
    </div>
  );
}
