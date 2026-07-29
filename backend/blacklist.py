"""Corporate / Zillow-structure brokerage blacklist for AgentEscrow.

Agents affiliated with these brokerages (or brokerages that match the
corporate-iBuyer pattern) may NOT participate as lead-receiving agents.
"""

# Case-insensitive substring match on brokerage name
CORPORATE_BLACKLIST = [
    "zillow",
    "zillow home loans",
    "zillow premier",
    "trulia",
    "redfin",
    "redfin now",
    "opendoor",
    "offerpad",
    "compass",  # corporate iBuyer-adjacent — flag for manual review
    "homelight",
    "rocket homes",
    "realogy",
    "anywhere real estate",
    "orchard",
    "flyhomes",
    "houwzer",
    "reali",
]


def is_blacklisted(brokerage_name: str) -> tuple[bool, str | None]:
    """Return (blocked, matched_term).

    A match on any substring flags the brokerage. Case-insensitive.
    """
    if not brokerage_name:
        return False, None
    name = brokerage_name.strip().lower()
    for term in CORPORATE_BLACKLIST:
        if term in name:
            return True, term
    return False, None
