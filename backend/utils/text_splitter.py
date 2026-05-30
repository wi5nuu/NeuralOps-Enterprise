from typing import List, Dict


class RecursiveTextSplitter:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = ["\n\n", "\n", ". ", " ", ""]

    def split_text(self, text: str) -> List[Dict]:
        chunks = []
        current = []
        current_length = 0

        paragraphs = text.split("\n\n")
        for para in paragraphs:
            sentences = para.replace("\n", " ").split(". ")
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                if not sentence.endswith("."):
                    sentence += "."

                token_count = self._count_tokens(sentence)

                if current_length + token_count > self.chunk_size and current:
                    chunk_text = " ".join(current)
                    chunks.append({"text": chunk_text, "token_count": current_length})
                    overlap_text = []
                    overlap_len = 0
                    for s in reversed(current):
                        s_tokens = self._count_tokens(s)
                        if overlap_len + s_tokens > self.chunk_overlap:
                            break
                        overlap_text.insert(0, s)
                        overlap_len += s_tokens
                    current = overlap_text
                    current_length = overlap_len

                current.append(sentence)
                current_length += token_count

        if current:
            chunk_text = " ".join(current)
            chunks.append({"text": chunk_text, "token_count": current_length})

        return chunks

    def _count_tokens(self, text: str) -> int:
        return int(len(text) / 4) + 1
