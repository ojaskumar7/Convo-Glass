export interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  emoji: string;
  avatarColor: string;
  voiceRate: number;
  voicePitch: number;
  intro: string;
  sampleQuestions: string[];
  responses: {
    default: string;
    um: string;
    agreement: string;
  };
}

export interface CodingQuestion {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  languages: {
    javascript: {
      starter: string;
      solution: string;
    };
    python: {
      starter: string;
      solution: string;
    };
  };
  testCases: {
    input: string;
    expected: string;
  }[];
}

export interface SystemDesignTopic {
  id: string;
  title: string;
  description: string;
  expectedComponents: string[];
  evaluationCriteria: string[];
}

export interface SessionMetrics {
  startTime: number;
  firstWordTime?: number;
  thinkingTime: number | string;
  speakingTime: number | string;
  fillerCount: number;
  wordCount: number;
  detectedFillers: string[];
  wordsPerMinute: number;
  confidenceScore: number;
  transcript: string;
}

export const INTERVIEW_PERSONAS: InterviewerPersona[] = [
  {
    id: "friendly-fred",
    name: "Friendly Fred",
    role: "HR / Behavioral Specialist",
    emoji: "😊",
    avatarColor: "#10b981", // Emerald
    voiceRate: 1.05,
    voicePitch: 1.1,
    intro: "Hey there! I'm Fred. I want to keep this really relaxed. Let's talk about your journey and how you collaborate. Ready to start?",
    sampleQuestions: [
      "Tell me about a time you had a major disagreement with a team member. How did you resolve it?",
      "Can you share an experience where you set a goal for yourself but failed to achieve it? What did you learn?",
      "Why do you want to join our team? What excites you most about this role?"
    ],
    responses: {
      default: "That's a really great perspective. I love how you focused on collaboration there. Let me ask you this: how did your team react to that approach?",
      um: "No worries, take your time! I'd love to hear a bit more details about the outcome.",
      agreement: "Perfect! I think conflict resolution is so key. Can you elaborate on what you would do differently if faced with it again?"
    }
  },
  {
    id: "strict-sarah",
    name: "Strict Sarah",
    role: "Lead Systems Engineer",
    emoji: "🤨",
    avatarColor: "#f43f5e", // Rose
    voiceRate: 0.95,
    voicePitch: 0.9,
    intro: "Welcome. I'm Sarah. I look for technical depth, structural reasoning, and direct answers. I will challenge your assertions. Let's begin.",
    sampleQuestions: [
      "Explain what happens under the hood when a user types a URL in their browser and presses Enter. Be highly technical.",
      "How would you design a rate limiter for a public API that receives 50,000 requests per second? What algorithms would you choose?",
      "What are the specific trade-offs between dynamic database sharding vs consistent hashing for distributed caches?"
    ],
    responses: {
      default: "Understood. However, you didn't cover the network routing or DNS resolution details. Explain specifically how BGP or load balancers factor in here.",
      um: "Please avoid filler phrases. Focus on the core system components and explain the bottleneck.",
      agreement: "That is a standard answer. Now, walk me through what happens when one of your database nodes fails. How do you prevent data loss?"
    }
  },
  {
    id: "faang-frank",
    name: "FAANG Frank",
    role: "Senior Engineering Manager",
    emoji: "😎",
    avatarColor: "#8b5cf6", // Violet
    voiceRate: 1.0,
    voicePitch: 1.0,
    intro: "Hey. I'm Frank. I've done hundreds of coding and architecture interviews. Let's see how you approach problem-solving under pressure. Let's jump in.",
    sampleQuestions: [
      "Given an array of integers representing stock prices, find the maximum profit you can make by buying and selling at most twice.",
      "How would you design a real-time collaborative document editor like Google Docs? Focus on conflict resolution.",
      "Design a highly available distributed task scheduler that guarantees at-least-once execution."
    ],
    responses: {
      default: "Okay, that's an okay start. What is the time and space complexity of your approach? Can we optimize this to run in linear time?",
      um: "Let's write out the algorithmic logic. Think about edge cases—what if the input is empty or contains negative values?",
      agreement: "Correct. That optimization works. Now, let's write the code for it. How will you write the unit tests to verify the edge cases?"
    }
  }
];

export const CODING_QUESTIONS: CodingQuestion[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
    languages: {
      javascript: {
        starter: `function twoSum(nums, target) {
  // Write your code here
  
}`,
        solution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`
      },
      python: {
        starter: `def two_sum(nums, target):
    # Write your code here
    pass`,
        solution: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`
      }
    },
    testCases: [
      { input: "[2,7,11,15], 9", expected: "[0,1]" },
      { input: "[3,2,4], 6", expected: "[1,2]" },
      { input: "[3,3], 6", expected: "[0,1]" }
    ]
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    difficulty: "Medium",
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(capacity)\` Initialize the LRU cache with positive size capacity.
- \`get(key)\` Return the value of the key if the key exists, otherwise return -1.
- \`put(key, value)\` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity, evict the least recently used key.`,
    languages: {
      javascript: {
        starter: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    // Write code here
    
  }

  put(key, value) {
    // Write code here
    
  }
}`,
        solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}`
      },
      python: {
        starter: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
        solution: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.order.remove(key)
        self.order.append(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            oldest = self.order.pop(0)
            del self.cache[oldest]
        self.cache[key] = value
        self.order.append(key)`
      }
    },
    testCases: [
      { input: "LRUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2)", expected: "1, -1" }
    ]
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    languages: {
      javascript: {
        starter: `function isValid(s) {
  // Write your code here
  
}`,
        solution: `function isValid(s) {
  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}`
      },
      python: {
        starter: `def is_valid(s: str) -> bool:
    # Write your code here
    pass`,
        solution: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping.values():
            stack.append(char)
        elif char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            return False
    return not stack`
      }
    },
    testCases: [
      { input: "\"()\"", expected: "true" },
      { input: "\"()[]{}\"", expected: "true" },
      { input: "\"(]\"", expected: "false" }
    ]
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Medium",
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.`,
    languages: {
      javascript: {
        starter: `function reverseList(head) {
  // Write your code here
  
}`,
        solution: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`
      },
      python: {
        starter: `def reverse_list(head):
    # Write your code here
    pass`,
        solution: `def reverse_list(head):
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev`
      }
    },
    testCases: [
      { input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" }
    ]
  }
];

export const SYSTEM_DESIGN_TOPICS: SystemDesignTopic[] = [
  {
    id: "url-shortener",
    title: "TinyURL / URL Shortener",
    description: "Design a system that takes long URLs and compresses them into shorter URLs that redirect correctly, handling millions of requests per day.",
    expectedComponents: ["Client", "Load Balancer", "Web Server", "Cache (Redis)", "Database (NoSQL/SQL)"],
    evaluationCriteria: ["Scalability", "High Availability", "Key Generation Service (KGS)", "Read/Write Trade-offs"]
  },
  {
    id: "chat-system",
    title: "Real-time Chat Application",
    description: "Design a chat system like WhatsApp or Slack, which supports one-on-one chat, group chat, online/offline status, and read receipts.",
    expectedComponents: ["Client", "API Gateway", "WebSocket Server", "Presence Service", "Message Store (Cassandra)", "Notification Service"],
    evaluationCriteria: ["WebSockets vs HTTP Polling", "Connection state handling", "Message sequencing", "Data replication"]
  },
  {
    id: "twitter-feed",
    title: "Twitter / News Feed System",
    description: "Design a scalable news feed system like Twitter or Facebook, where users can post tweets, follow other users, and view a feed of combined postings.",
    expectedComponents: ["Client", "Load Balancer", "Web Server", "Fan-out Service", "Redis Feed Cache", "Relational Database", "Graph Database"],
    evaluationCriteria: ["Push vs Pull model for feed generation", "Fan-out execution on write vs read", "Cache eviction policies", "Hot users handling"]
  },
  {
    id: "google-drive",
    title: "Distributed File Storage (Google Drive)",
    description: "Design a secure, highly available distributed file storage system like Dropbox or Google Drive. Users can upload, download, share, and sync files across devices.",
    expectedComponents: ["Client", "Block Server", "Metadata Server", "Metadata DB", "Object Storage (S3)", "Notification Service", "Synchronization Service"],
    evaluationCriteria: ["Chunking files for upload speed and deduplication", "Conflict resolution for concurrent edits", "Delta sync logic", "Data durability guarantees"]
  }
];
