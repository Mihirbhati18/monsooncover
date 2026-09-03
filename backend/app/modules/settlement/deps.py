"""Adapter wiring for the API.

The sandbox adapters hold state in process, so they are module-level
singletons for the lifetime of the server. That is adequate for the
offline demo (MONSOONCOVER_SPEC.md §8.3 lists these external systems as
simulated) but it is a real limitation: restarting the server clears the
sandboxes' memory, while the authoritative rows stay in the database.
Swapping in a real adapter is a change to these two functions only —
nothing in the domain layer imports a sandbox directly.
"""

from app.adapters.insurer.sandbox import SandboxInsurerAdapter
from app.adapters.lender.sandbox import SandboxLenderAdapter

_insurer_adapter = SandboxInsurerAdapter()
_lender_adapter = SandboxLenderAdapter()


def get_insurer_adapter() -> SandboxInsurerAdapter:
    return _insurer_adapter


def get_lender_adapter() -> SandboxLenderAdapter:
    return _lender_adapter
