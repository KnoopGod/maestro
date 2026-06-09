# Agent Chain Operations

## Runtime chain

The MVP chain stays:

```txt
client profile -> strategy -> resources/library -> generated post -> validation -> scheduling/publication -> performance/profit review
```

Operationally, the agents split that chain as:

1. Account Director loads the client context and turns the request into a clear business priority.
2. Strategy Director / Planner proposes post ideas tied to pillars, objectives and publishing rhythm.
3. Social Expert writes platform captions, hooks, CTAs and hashtags.
4. DA Curator and Vision Analyzer turn library resources into reusable visual direction.
5. Visual Director generates or guides the post visual from the brief and DA.
6. Supervisor is the editorial quality gate before publication.
7. Publisher posts only validated content to connected Meta accounts.
8. Performance Analyst reviews real post metrics after publication.
9. Profit Controller reviews margin, budget use and expensive production choices post-campaign or monthly.

## Expert profiles

Shared senior expertise lives in `lib/agents/prompts/index.ts` under `AGENT_EXPERTISE_PROFILES`.

`lib/agent-registry.ts` enriches visible agent metadata from those profiles:

- `seniorPersona`
- `feedbackLoop`
- `failureModes`

Keep the profile as the source of truth. Do not duplicate large prompt text in registry cards, pages or tracking events.

## Quality envelope

`AgentQualityEnvelope<TPayload>` is the future standard for richer handoffs:

```ts
{
  agentId,
  confidence,
  assumptions,
  risks,
  recommendations,
  nextAgent,
  payload
}
```

Adopt it progressively when a caller benefits from explicit uncertainty or next-agent routing. Do not force every existing agent to return it in one migration. Good first candidates are Supervisor, Performance Analyst and Profit Controller because they already produce risks, recommendations or gate decisions.

Use `createAgentQualityEnvelope` so confidence is clamped between 0 and 1 and empty arrays default cleanly.

## Profit Controller gate

Profit Controller is a control agent, not a creative step. Run it after a campaign or monthly, and before approving costly production such as videos, high-volume image generation or paid media bursts.

Currently real data includes:

- stored post API cost;
- stored token usage;
- generated post count;
- analyzed image count;
- DA synthesis count;
- configured client finance settings.

Currently estimated data includes:

- image analysis unit cost;
- DA synthesis unit cost;
- generated image unit cost;
- generated video unit cost;
- fallback API cost for remaining planned posts;
- internal time cost from configured hours and hourly rate.

It should warn when projected margin is below target, API budget use is high, or video spend leaves too little margin buffer. It should block or require human approval when projected profit is negative, the retainer is missing, or expensive video/ad spend is requested without clear budget assumptions.

## Human validation boundaries

Do not automate these without human validation yet:

- final publishing for a new client or new connected account;
- claims about prices, availability, events, awards or legal/compliance facts;
- large paid media budget changes;
- high-cost video generation at scale;
- client strategy changes based on small performance samples;
- Profit Controller decisions that reduce contracted deliverables or change pricing.

The system can recommend and prepare. A human should approve client-visible commitments and margin-impacting changes until the data is reliable enough to automate.
