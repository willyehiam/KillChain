# Justice Mission 2026 Scenario Sourcebook

## Scenario premise

The campaign begins at 17:40 on 28 July 2026. A declared live fire exercise is scheduled to terminate at 18:00. It does not terminate.

The historical reference is Justice Mission 2025. The scenario preserves the published exercise geography, the reported scale of activity, the identified maritime assets, the civil aviation disruption, and the ambiguity created by military and Coast Guard operations. The fictional branch begins when the declared control measures remain in force after 18:00 and Coast Guard formations begin directing commercial traffic.

## Player facing first hour

1. Read the five declared exercise areas and inspect the reported formations on the map.
2. Choose an opening posture that balances access, readiness, political legitimacy, and escalation.
3. Maintain custody on ambiguous tracks while the 18:00 deadline approaches.
4. At 18:00 the simulation pauses. The player learns that the exercise did not terminate.
5. The player must decide whether the activity is a safety regime, a coercive quarantine, preparation for a blockade, or cover for a wider operation.

The opening problem is intentionally legible. The deeper systems appear as consequences of the first decision rather than as a wall of menus.

## Historical baseline

The simulator stores each observation in its proper unit of measure.

| Branch or service | Measure | Publicly supportable value | Simulation meaning |
| --- | --- | --- | --- |
| PLA Air Force | Sorties | 207 across the main forty eight hours | Operational tempo, fuel demand, airfield generation, and sensor workload |
| PLA Navy | Peak presence | 17 ships | Persistent maritime objects with routes, endurance, and formation relationships |
| China Coast Guard | Peak presence | 15 vessels | Persistent white hull objects that create legal and escalation ambiguity |
| PLA Ground Force | Fires | 27 rockets | Munition expenditure and exclusion risk, not a platform count |
| PLA Ground Force | Formations | Two identified firing formations | Mobile force objects with uncertain launcher strength |
| PLA Rocket Force | Organizations | At least two associated organizations | Warning intelligence with unresolved platform quantity |
| Civil aviation | Disruption | 941 flights | Civil access, legitimacy, and economic continuity pressure |

These categories are never added into a single total. A sortie is not an airframe. A peak snapshot is not a unique ship count. A formation is not a launcher count. A rocket is not a launch vehicle.

## Exercise geography

The five operating areas use the coordinates published for Justice Mission 2025. Coordinates are stored in GeoJSON order as longitude and latitude while the original degree minute second strings remain attached to each polygon for audit.

The areas affect:

1. The northeastern approaches to Keelung.
2. The northwestern civil aviation corridor.
3. The southwestern approaches to Kaohsiung.
4. The southern Bashi approach.
5. The southeastern reinforcement corridor.

Each polygon can be selected on the map to inspect its source vertices and declared restriction.

## Maritime order of battle

Public reporting identified eight PLA Navy ships:

1. Hainan, hull 31, Type 075.
2. Taiyuan, hull 131.
3. Xi’an, hull 153.
4. Huaibei, hull 516.
5. Quzhou, hull 517.
6. Baoji, hull 534.
7. Yixing, hull 537.
8. Anyang, hull 599.

Hainan is modeled as the identified central ship of a four ship amphibious group east and southeast of Taiwan. The other three members remain unresolved until collection improves. The simulator does not invent their identities.

Public reporting identified at least seven China Coast Guard hulls:

1. CCG 1302.
2. CCG 1303.
3. CCG 1306.
4. CCG 2203.
5. CCG 2204.
6. CCG 14606.
7. CCG 14609.

Four linked Coast Guard formations cover northern, eastern, southern, and western patrol arcs. Together they produce a continuous moving circuit around Taiwan. The player can observe confirmed hulls without receiving perfect knowledge of every vessel in the reported peak presence.

## Air and land activity

The map represents the PLAAF surge as a formation level tempo object. It does not create 207 aircraft icons. Air activity increases revisit demand, consumes defensive readiness, and makes track custody more expensive.

The Ground Force fires model contains two mobile formations:

1. A 72nd Group Army fires formation dispersing from the Pingtan area.
2. A 73rd Group Army fires formation dispersing from the Shishi area.

The historical baseline records seventeen rockets from Pingtan and ten from Shishi. The exact launcher count remains unknown.

Rocket Force activity remains a warning intelligence problem. Public analysis associated a Base 61 missile brigade battalion and an unmanned aircraft regiment, but no reliable launcher quantity exists. The simulation therefore begins with organizational indicators and unresolved platform hypotheses.

## Scenario beats

| Time from start | Beat | Mechanical consequence |
| --- | --- | --- |
| Ten minutes | Declared termination approaches | Warning event and decision preparation |
| Twenty minutes | Exercise window expires | Simulation pause, increased adversary tempo, reduced shipping and civil access, increased escalation |
| One hour | Selective inspections reported | Further loss of shipping and civil access |
| Ninety minutes | White hull circuit sustained | Greater ambiguity and information pressure |
| Three hours | Eastern amphibious group holds | Readiness cost, coalition attention, and escalation pressure |
| Six hours | Civil corridors remain constrained | Continuity and political pressure |
| Twelve hours | Quarantine pattern assessed | Persistent blockade effects without a formal blockade declaration |

## Fog of war rules

1. Publicly identified hulls may appear as reported neutral objects to an opposing player. They cannot be commanded.
2. Unidentified escorts remain formation strength, not named platforms.
3. Reported force levels carry a source confidence label.
4. Peak presence is not treated as a permanent exact count.
5. Tracks can become stale, regress, or split when formations disperse.
6. A player may know that a patrol circuit exists without knowing every vessel participating in it.

## Historical divergence policy

All events before 18:00 use the historical reference as a scenario baseline. The continued control measures, inspections, quarantine behavior, and subsequent player choices are fictional. The interface labels this divergence explicitly so a player can distinguish sourced history from scenario design.

## Source notes

The scenario was informed by the attached Global Taiwan Brief, Volume 11, Issue 1, especially the article on Justice Mission 2025 and its discussion of exercise phases, force activity, live fires, amphibious presence, political warfare, civil disruption, and warning intelligence. Additional user supplied reporting provided the corrected complete sortie total, the peak maritime snapshots, named hulls, firing formations, and Coast Guard patrol identities.
