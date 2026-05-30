import { useState, useRef, useCallback } from "react";

export function useStreaming() {
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const startStream = useCallback((url) => {
    setIsStreaming(true);
    setStreamingContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.token || ""}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "chunk") {
                  setStreamingContent((prev) => prev + data.content);
                } else if (data.type === "done") {
                  setIsStreaming(false);
                } else if (data.type === "error") {
                  setIsStreaming(false);
                }
              } catch {}
            }
          }
        }
        setIsStreaming(false);
      })
      .catch(() => setIsStreaming(false));

    return controller;
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { streamingContent, isStreaming, startStream, stopStream };
}
