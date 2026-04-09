"""
Seed script — creates realistic demo data for EngageTrack.
Run via:  make seed   OR   python seed.py  (from backend/ with venv active)
"""
from datetime import date, datetime, timezone, timedelta
from app import create_app
from app.extensions import db
from app.models import Client, Project, Milestone, Approval, StatusUpdate
from app.services.health_calculator import calculate_health

app = create_app()


def _dt(d: date) -> datetime:
    """Convert date to a UTC datetime at noon."""
    return datetime(d.year, d.month, d.day, 12, 0, 0, tzinfo=timezone.utc)


def clear_all():
    db.session.execute(db.text("DELETE FROM approvals"))
    db.session.execute(db.text("DELETE FROM status_updates"))
    db.session.execute(db.text("DELETE FROM milestones"))
    db.session.execute(db.text("DELETE FROM projects"))
    db.session.execute(db.text("DELETE FROM clients"))
    db.session.commit()
    print("Cleared existing data.")


with app.app_context():
    clear_all()

    # ── Clients ──────────────────────────────────────────────────────────────

    meridian = Client(
        name="Meridian Health",
        contact_email="pm@meridianhealth.com",
        industry="Healthcare",
        status="active",
    )
    volt = Client(
        name="Volt Energy",
        contact_email="tech@voltenergy.io",
        industry="Clean Energy",
        status="active",
    )
    novapay = Client(
        name="NovaPay",
        contact_email="cto@novapay.finance",
        industry="Fintech",
        status="active",
    )
    db.session.add_all([meridian, volt, novapay])
    db.session.flush()

    # ── Project 1: Patient Portal Redesign — health ~85 ──────────────────────

    portal = Project(
        client_id=meridian.id,
        name="Patient Portal Redesign",
        description="Modernise the patient-facing portal with a new design system and improved accessibility.",
        status="in_progress",
        start_date=date(2025, 9, 1),
        target_end_date=date(2026, 6, 30),
        health_score=100,
    )
    db.session.add(portal)
    db.session.flush()

    m1 = Milestone(project_id=portal.id, title="Discovery & Requirements", status="completed",
                   due_date=date(2025, 10, 15),
                   completed_at=_dt(date(2025, 10, 12)), sort_order=1)
    m2 = Milestone(project_id=portal.id, title="UI Design System", status="completed",
                   due_date=date(2025, 11, 30),
                   completed_at=_dt(date(2025, 11, 28)), sort_order=2)
    m3 = Milestone(project_id=portal.id, title="Backend API Integration", status="completed",
                   due_date=date(2026, 1, 31),
                   completed_at=_dt(date(2026, 1, 29)), sort_order=3)
    m4 = Milestone(project_id=portal.id, title="Patient Dashboard", status="in_progress",
                   due_date=date(2026, 3, 31), sort_order=4)
    m5 = Milestone(project_id=portal.id, title="UAT & Accessibility Audit", status="pending",
                   due_date=date(2026, 5, 31), sort_order=5)
    db.session.add_all([m1, m2, m3, m4, m5])
    db.session.flush()

    # Approvals for completed milestones
    db.session.add_all([
        Approval(milestone_id=m1.id, approved_by="Dr. Rachel Kim", decision="approved",
                 comments="Requirements look thorough. Good to proceed.",
                 decided_at=_dt(date(2025, 10, 13))),
        Approval(milestone_id=m2.id, approved_by="Sarah Chen", decision="approved",
                 comments="Design system meets WCAG 2.1 AA standards.",
                 decided_at=_dt(date(2025, 11, 29))),
        Approval(milestone_id=m3.id, approved_by="Marcus Webb", decision="approved",
                 comments="All endpoints tested and documented.",
                 decided_at=_dt(date(2026, 1, 30))),
    ])

    db.session.add_all([
        StatusUpdate(project_id=portal.id, content="Discovery phase complete. 47 user interviews conducted across 3 hospital sites.", update_type="progress"),
        StatusUpdate(project_id=portal.id, content="Design system approved by accessibility board. Token library exported to Figma.", update_type="progress"),
        StatusUpdate(project_id=portal.id, content="Minor delay on FHIR API specs from the hospital IT team — 5-day buffer consumed.", update_type="risk"),
        StatusUpdate(project_id=portal.id, content="Backend integration complete. All 23 endpoints passing contract tests.", update_type="progress"),
    ])

    # ── Project 2: Claims Automation — health 100 ─────────────────────────────

    claims = Project(
        client_id=meridian.id,
        name="Claims Automation",
        description="Automate the manual claims processing workflow using ML-assisted routing and validation.",
        status="planning",
        start_date=date(2026, 2, 1),
        target_end_date=date(2026, 9, 30),
        health_score=100,
    )
    db.session.add(claims)
    db.session.flush()

    db.session.add_all([
        Milestone(project_id=claims.id, title="Process Mapping & Analysis", status="pending",
                  due_date=date(2026, 3, 15), sort_order=1),
        Milestone(project_id=claims.id, title="ML Model Training", status="pending",
                  due_date=date(2026, 6, 30), sort_order=2),
        Milestone(project_id=claims.id, title="Integration & Testing", status="pending",
                  due_date=date(2026, 8, 31), sort_order=3),
    ])

    db.session.add(
        StatusUpdate(project_id=claims.id, content="Project kickoff scheduled for Feb 3rd. Stakeholder alignment meeting confirmed.", update_type="general")
    )

    # ── Project 3: Solar Dashboard — health ~55 (blockers + overdue) ──────────

    solar = Project(
        client_id=volt.id,
        name="Solar Dashboard",
        description="Real-time monitoring dashboard for Volt's 14 solar farm installations across the Southwest.",
        status="in_progress",
        start_date=date(2025, 8, 1),
        target_end_date=date(2026, 4, 30),
        health_score=100,
    )
    db.session.add(solar)
    db.session.flush()

    ms1 = Milestone(project_id=solar.id, title="Data Pipeline Architecture", status="completed",
                    due_date=date(2025, 9, 30),
                    completed_at=_dt(date(2025, 10, 14)),  # completed LATE
                    sort_order=1)
    ms2 = Milestone(project_id=solar.id, title="IoT Sensor Integration", status="in_progress",
                    due_date=date(2025, 12, 31),  # overdue
                    sort_order=2)
    ms3 = Milestone(project_id=solar.id, title="Real-Time Dashboard UI", status="pending_approval",
                    due_date=date(2026, 2, 28), sort_order=3)
    ms4 = Milestone(project_id=solar.id, title="Alerting & Notifications", status="pending",
                    due_date=date(2026, 4, 15), sort_order=4)
    db.session.add_all([ms1, ms2, ms3, ms4])
    db.session.flush()

    db.session.add_all([
        StatusUpdate(project_id=solar.id, content="Firmware vendor (SolarEdge) is unresponsive for 3 weeks. IoT integration halted. Escalated to account manager.", update_type="blocker"),
        StatusUpdate(project_id=solar.id, content="Data pipeline delayed 2 weeks due to cloud provider maintenance window conflicts.", update_type="risk"),
        StatusUpdate(project_id=solar.id, content="Dashboard UI prototype completed and submitted for approval. Awaiting client sign-off.", update_type="progress"),
        StatusUpdate(project_id=solar.id, content="New IoT vendor (Enphase) agreed to provide test harness. Unblocks integration path.", update_type="blocker"),
    ])

    # ── Project 4: Payment Gateway v2 — health ~72 ────────────────────────────

    gateway = Project(
        client_id=novapay.id,
        name="Payment Gateway v2",
        description="Complete rebuild of NovaPay's payment processing gateway with PCI DSS Level 1 compliance.",
        status="in_progress",
        start_date=date(2025, 10, 1),
        target_end_date=date(2026, 7, 31),
        health_score=100,
    )
    db.session.add(gateway)
    db.session.flush()

    mg1 = Milestone(project_id=gateway.id, title="Security Architecture Review", status="completed",
                    due_date=date(2025, 11, 15),
                    completed_at=_dt(date(2025, 11, 14)), sort_order=1)
    mg2 = Milestone(project_id=gateway.id, title="Core Transaction Engine", status="completed",
                    due_date=date(2026, 1, 31),
                    completed_at=_dt(date(2026, 1, 28)), sort_order=2)
    mg3 = Milestone(project_id=gateway.id, title="Fraud Detection Module", status="completed",
                    due_date=date(2026, 2, 28),
                    completed_at=_dt(date(2026, 3, 10)),  # late completion
                    sort_order=3)
    mg4 = Milestone(project_id=gateway.id, title="3DS2 Authentication", status="in_progress",
                    due_date=date(2026, 4, 30), sort_order=4)
    mg5 = Milestone(project_id=gateway.id, title="Merchant API & SDK", status="pending",
                    due_date=date(2026, 6, 15), sort_order=5)
    mg6 = Milestone(project_id=gateway.id, title="PCI DSS Audit & Certification", status="pending",
                    due_date=date(2026, 7, 15), sort_order=6)
    db.session.add_all([mg1, mg2, mg3, mg4, mg5, mg6])
    db.session.flush()

    db.session.add_all([
        Approval(milestone_id=mg1.id, approved_by="James Okafor", decision="approved",
                 comments="Architecture approved by external security consultant.",
                 decided_at=_dt(date(2025, 11, 15))),
        Approval(milestone_id=mg2.id, approved_by="James Okafor", decision="approved",
                 comments="Transaction throughput exceeds 10k TPS target. Approved.",
                 decided_at=_dt(date(2026, 1, 29))),
        Approval(milestone_id=mg3.id, approved_by="Priya Nair", decision="rejected",
                 comments="False positive rate too high on international transactions. Return to engineering.",
                 decided_at=_dt(date(2026, 3, 5))),
        Approval(milestone_id=mg3.id, approved_by="Priya Nair", decision="approved",
                 comments="False positive rate reduced to 0.3%. Approved for production.",
                 decided_at=_dt(date(2026, 3, 11))),
    ])

    db.session.add_all([
        StatusUpdate(project_id=gateway.id, content="Security architecture reviewed by Deloitte. No critical findings. Minor recommendations addressed.", update_type="progress"),
        StatusUpdate(project_id=gateway.id, content="Transaction engine hitting 12k TPS in load tests. Well above the 10k target.", update_type="progress"),
        StatusUpdate(project_id=gateway.id, content="Fraud model initially rejected — false positive rate on EU cards was 2.1%. Retrained with expanded dataset.", update_type="risk"),
        StatusUpdate(project_id=gateway.id, content="3DS2 implementation delayed by Visa's certification queue — 3-week wait for test environment access.", update_type="blocker"),
        StatusUpdate(project_id=gateway.id, content="Fraud module re-approved. 3DS2 test environment access granted by Visa.", update_type="progress"),
    ])

    # ── Recalculate all health scores ─────────────────────────────────────────

    db.session.commit()

    for project in [portal, claims, solar, gateway]:
        db.session.refresh(project)
        project.health_score = calculate_health(project)

    db.session.commit()
    print("Health scores recalculated.")

    # ── Summary ───────────────────────────────────────────────────────────────

    print("\n✓ Seed complete!")
    print(f"  Clients:  3")
    print(f"  Projects: 4")
    for p in [portal, claims, solar, gateway]:
        db.session.refresh(p)
        print(f"    [{p.health_score:3d}] {p.name} ({p.status})")
    print()
