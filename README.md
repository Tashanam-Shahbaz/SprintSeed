# SprintSpeed

A collaborative AI-powered platform to streamline software development planning through intelligent agents.

## 🚀 Objective

SprintSpeed enables:
- Users (e.g., BAs, Managers) to input requirements.
- AI agents to convert user input into structured documents (SRS).
- Automated ticket creation based on approved specs.
- Smart task assignment to developers using availability, expertise, and priorities.

## 🧠 Agent Flow

```text
1. User submits requirement → (via prompt or document)

2. ➤ SRSCreatorAgent
   - Analyzes user input
   - Generates SRS
   - Supports iterative refinement (human feedback loop)

3. ➤ TaskCreatorAgent
   - Parses approved SRS
   - Creates technical tasks/tickets with labels, effort estimates

4. ➤ TaskAssignerAgent
   - Fetches developer metadata (availability, expertise, workload)
   - Assigns tasks accordingly
````

## 🧱 Core Entities

* **User**
* **Projects**
* **Tasks**
* **Team**
* **Comments**
* **Notifications**



## 💡 Agent Component Comments (In-code Pseudocode Style)

### 🧾 `SRSCreatorAgent`
```python
# Purpose: Converts user requirements into structured SRS
# Workflow:
#   1. Accepts streaming input (text/prompt/file)
#   2. Generates draft SRS with functional and non-functional sections
#   3. Iterates with human feedback
#   4. Finalizes SRS for use by downstream agents
````

### 🧱 `TaskCreatorAgent`

```python
# Purpose: Breaks SRS into actionable tickets
# Workflow:
#   1. Parses finalized SRS
#   2. Generates task tickets (title, description, estimate)
#   3. Pushes to ticket DB or external tools (e.g., GitHub issues)
```

### 🧠 `TaskAssignerAgent`

```python
# Purpose: Assigns tasks to developers based on intelligent criteria
# Workflow:
#   1. Reads user database (expertise, workload, availability)
#   2. Applies task priority rules
#   3. Assigns each task to the most suitable developer
```