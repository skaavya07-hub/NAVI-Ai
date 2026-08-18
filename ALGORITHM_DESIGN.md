# NAVI-AI Algorithm Design — JavaScript Edition

## 1. Problem formulation

A voyage is a path `R = {v0, v1, ..., vn}` over navigable geographic nodes. An edge cost is time-dependent because the ship reaches each sea cell at a different forecast time.

For an edge `(i,j)` reached at time `t`, NAVI-AI estimates:

- segment distance
- effective ship speed
- segment travel time
- fuel consumption
- safety risk
- wind, wave and current exposure

The multi-objective edge cost is:

`J(i,j,t) = wt*T_hat + wf*F_hat + ws*Risk^1.35`

Hard constraints reject candidate edges above the configured wind, wave or safety-risk limits.

## 2. Effective speed model

Prototype form:

`Veff = Vcalm - wavePenalty - headWindPenalty + alongRouteCurrent`

The architecture keeps this model isolated so a ship-specific resistance/power model can replace it later.

## 3. Fuel model

Fuel is based on base hourly consumption, segment duration, sea-state resistance and effective-speed ratio. It is a comparative optimization model rather than a certified bunker-consumption predictor.

## 4. Search strategy

The primary search is multi-objective **A\***:

`f(n) = g(n) + h(n)`

`g(n)` is accumulated multi-objective cost. `h(n)` is an optimistic time-only estimate derived from great-circle distance and an optimistic vessel speed.

A Dijkstra implementation uses the same edge model with `h(n)=0`, allowing a direct runtime/visited-node benchmark.

## 5. Live forecast fusion

A public API should not be queried once for every A* edge. That would be slow and brittle. The hackathon implementation therefore uses a two-stage architecture:

1. A deterministic, time-varying environmental field supplies dense edge costs and produces several viable A* candidates.
2. Each candidate is sampled at representative route positions and ETAs.
3. Open-Meteo live/updated wind, wave and ocean-current forecasts recompute candidate metrics.
4. Candidates violating live hard limits are rejected; the remaining candidates are re-ranked using the user's objective weights.

In production, step 1 becomes a locally cached gridded forecast cube downloaded from a forecast provider. The A* edge evaluator then interpolates the live grid directly, retaining the same routing API.

## 6. Dynamic re-routing

At voyage progress `p`, NAVI-AI identifies the corresponding current waypoint, advances the forecast horizon, and runs A* again for the remaining voyage. This demonstrates how the route evolves as weather evolves.

A research/production version can replace repeated full A* with D* Lite or Lifelong Planning A* to reuse previous search state.

## 7. Extensibility

Additional objective/constraint terms can be added without redesigning the search:

- passenger comfort / vertical acceleration
- emissions / CII impact
- piracy/security zones
- ECA compliance
- draught / under-keel clearance
- port ETA windows
- cargo-specific motion constraints
- traffic-separation schemes
- forecast uncertainty

## 8. Safety note

NAVI-AI is a decision-support prototype. It is not a substitute for ECDIS, official nautical charts, COLREG compliance, notices to mariners, a master/mariner's judgment, or certified weather-routing services.
