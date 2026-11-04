# Design-pattern catalogue

Check every entry; ask only the relevant ones.

## Mechanisms

| Pattern | Use it when |
|---------|-------------|
| Interface | Several implementations of one contract, or code that must not know the concrete type |
| Abstract class | Implementations share part of their code and differ on some steps |
| Dependency injection | A component needs a dependency it must not build itself (testable, replaceable) |
| Inversion of control | The framework drives the flow and calls your code |

## SOLID

| Principle | Use it when |
|-----------|-------------|
| Single responsibility | A module or component does more than one thing |
| Open / closed | New variants must be added without editing existing code |
| Liskov substitution | Implementations must be interchangeable without surprises |
| Interface segregation | A client uses only part of a large interface |
| Dependency inversion | High-level code must depend on an abstraction, not on a concrete module |

## Creational

| Pattern | Use it when |
|---------|-------------|
| Factory method | Building an object needs logic, or the concrete type depends on input |
| Abstract factory | Creating families of related objects that must match |
| Builder | Many optional parameters, or step-by-step construction |
| Prototype | New objects are copies of an existing one |
| Singleton | Exactly one shared instance |

## Structural

| Pattern | Use it when |
|---------|-------------|
| Adapter | Converting one interface or shape into another |
| Bridge | Two dimensions vary independently (abstraction × implementation) |
| Composite | Tree structures handled uniformly (item and group of items) |
| Decorator | Adding behavior around an object or call without changing it |
| Facade | One simple entry point over several calls or modules |
| Flyweight | Many similar objects share immutable data |
| Proxy | Controlling access to an object: cache, lazy loading, permission check |

## Behavioral

| Pattern | Use it when |
|---------|-------------|
| Chain of responsibility | A request goes through successive handlers, each may stop it |
| Command | Actions to queue, log, undo or replay |
| Interpreter | Evaluating a small language (search syntax, filter expressions) |
| Iterator | Walking a collection without exposing its structure |
| Mediator | Many components talk through one coordinator |
| Memento | Saving and restoring a past state |
| Observer | Reacting to changes |
| State | Behavior changes with the status, with allowed transitions |
| Strategy | Several interchangeable algorithms for the same job |
| Template method | Same steps, one or two varying steps |
| Visitor | New operations on a fixed set of types |
