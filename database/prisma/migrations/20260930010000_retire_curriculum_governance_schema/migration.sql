-- Recovery Foundation 4: retire the unused historical Curriculum governance
-- persistence. Canonical Curriculum remains file-backed and read-only.

-- DropForeignKey
ALTER TABLE "curriculum_audit_logs" DROP CONSTRAINT "curriculum_audit_logs_actorUserId_fkey";
ALTER TABLE "curriculum_audit_logs" DROP CONSTRAINT "curriculum_audit_logs_grantId_fkey";
ALTER TABLE "curriculum_audit_logs" DROP CONSTRAINT "curriculum_audit_logs_importId_fkey";
ALTER TABLE "curriculum_audit_logs" DROP CONSTRAINT "curriculum_audit_logs_versionId_fkey";
ALTER TABLE "curriculum_capability_grants" DROP CONSTRAINT "curriculum_capability_grants_grantedById_fkey";
ALTER TABLE "curriculum_capability_grants" DROP CONSTRAINT "curriculum_capability_grants_revokedById_fkey";
ALTER TABLE "curriculum_capability_grants" DROP CONSTRAINT "curriculum_capability_grants_userId_fkey";
ALTER TABLE "curriculum_import_issues" DROP CONSTRAINT "curriculum_import_issues_importId_fkey";
ALTER TABLE "curriculum_import_issues" DROP CONSTRAINT "curriculum_import_issues_resolvedById_fkey";
ALTER TABLE "curriculum_import_issues" DROP CONSTRAINT "curriculum_import_issues_sourceRecordId_fkey";
ALTER TABLE "curriculum_imports" DROP CONSTRAINT "curriculum_imports_importedById_fkey";
ALTER TABLE "curriculum_imports" DROP CONSTRAINT "curriculum_imports_retryOfImportId_fkey";
ALTER TABLE "curriculum_imports" DROP CONSTRAINT "curriculum_imports_targetVersionId_fkey";
ALTER TABLE "curriculum_node_mappings" DROP CONSTRAINT "curriculum_node_mappings_approvedById_fkey";
ALTER TABLE "curriculum_node_mappings" DROP CONSTRAINT "curriculum_node_mappings_createdById_fkey";
ALTER TABLE "curriculum_node_mappings" DROP CONSTRAINT "curriculum_node_mappings_from_revision_fkey";
ALTER TABLE "curriculum_node_mappings" DROP CONSTRAINT "curriculum_node_mappings_from_version_fkey";
ALTER TABLE "curriculum_node_mappings" DROP CONSTRAINT "curriculum_node_mappings_supersededById_fkey";
ALTER TABLE "curriculum_node_mappings" DROP CONSTRAINT "curriculum_node_mappings_to_revision_fkey";
ALTER TABLE "curriculum_node_mappings" DROP CONSTRAINT "curriculum_node_mappings_to_version_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_approvedById_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_createdById_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_source_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_source_version_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_supersededById_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_target_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_target_version_fkey";
ALTER TABLE "curriculum_node_relationships" DROP CONSTRAINT "curriculum_relationships_version_fkey";
ALTER TABLE "curriculum_node_revisions" DROP CONSTRAINT "curriculum_node_revisions_node_fkey";
ALTER TABLE "curriculum_node_revisions" DROP CONSTRAINT "curriculum_node_revisions_parent_fkey";
ALTER TABLE "curriculum_node_revisions" DROP CONSTRAINT "curriculum_node_revisions_type_fkey";
ALTER TABLE "curriculum_node_revisions" DROP CONSTRAINT "curriculum_node_revisions_version_fkey";
ALTER TABLE "curriculum_nodes" DROP CONSTRAINT "curriculum_nodes_createdById_fkey";
ALTER TABLE "curriculum_review_decisions" DROP CONSTRAINT "curriculum_review_decisions_reviewerId_fkey";
ALTER TABLE "curriculum_review_decisions" DROP CONSTRAINT "curriculum_review_decisions_validationRunId_fkey";
ALTER TABLE "curriculum_review_decisions" DROP CONSTRAINT "curriculum_review_decisions_versionId_fkey";
ALTER TABLE "curriculum_source_records" DROP CONSTRAINT "curriculum_source_records_importId_fkey";
ALTER TABLE "curriculum_source_records" DROP CONSTRAINT "curriculum_source_records_match_node_fkey";
ALTER TABLE "curriculum_source_records" DROP CONSTRAINT "curriculum_source_records_match_revision_fkey";
ALTER TABLE "curriculum_source_records" DROP CONSTRAINT "curriculum_source_records_match_version_fkey";
ALTER TABLE "curriculum_validation_runs" DROP CONSTRAINT "curriculum_validation_runs_initiatedById_fkey";
ALTER TABLE "curriculum_validation_runs" DROP CONSTRAINT "curriculum_validation_runs_versionId_fkey";
ALTER TABLE "curriculum_versions" DROP CONSTRAINT "curriculum_versions_basedOnVersionId_fkey";
ALTER TABLE "curriculum_versions" DROP CONSTRAINT "curriculum_versions_createdById_fkey";
ALTER TABLE "curriculum_versions" DROP CONSTRAINT "curriculum_versions_publishedById_fkey";
ALTER TABLE "legacy_curriculum_mappings" DROP CONSTRAINT "legacy_curriculum_mappings_createdById_fkey";
ALTER TABLE "legacy_curriculum_mappings" DROP CONSTRAINT "legacy_curriculum_mappings_reviewedById_fkey";
ALTER TABLE "legacy_curriculum_mappings" DROP CONSTRAINT "legacy_curriculum_mappings_revision_fkey";
ALTER TABLE "legacy_curriculum_mappings" DROP CONSTRAINT "legacy_curriculum_mappings_studySubjectId_fkey";
ALTER TABLE "legacy_curriculum_mappings" DROP CONSTRAINT "legacy_curriculum_mappings_supersededById_fkey";
ALTER TABLE "legacy_curriculum_mappings" DROP CONSTRAINT "legacy_curriculum_mappings_topicId_fkey";
ALTER TABLE "legacy_curriculum_mappings" DROP CONSTRAINT "legacy_curriculum_mappings_version_fkey";

-- DropTable
DROP TABLE "curriculum_audit_logs";
DROP TABLE "curriculum_capability_grants";
DROP TABLE "curriculum_import_issues";
DROP TABLE "curriculum_imports";
DROP TABLE "curriculum_node_mappings";
DROP TABLE "curriculum_node_relationships";
DROP TABLE "curriculum_node_revisions";
DROP TABLE "curriculum_node_types";
DROP TABLE "curriculum_nodes";
DROP TABLE "curriculum_review_decisions";
DROP TABLE "curriculum_source_records";
DROP TABLE "curriculum_validation_runs";
DROP TABLE "curriculum_versions";
DROP TABLE "legacy_curriculum_mappings";

-- Drop raw-SQL trigger functions left behind when their tables are dropped.
DROP FUNCTION "curriculum_guard_capability_grant"();
DROP FUNCTION "curriculum_guard_completed_import"();
DROP FUNCTION "curriculum_guard_completed_validation"();
DROP FUNCTION "curriculum_guard_issue_finding"();
DROP FUNCTION "curriculum_guard_legacy_mapping"();
DROP FUNCTION "curriculum_guard_node_mapping"();
DROP FUNCTION "curriculum_guard_published_version"();
DROP FUNCTION "curriculum_guard_source_record"();
DROP FUNCTION "curriculum_guard_version_content"();
DROP FUNCTION "curriculum_reject_mutation"();

-- DropEnum
DROP TYPE "CurriculumAuditOutcome";
DROP TYPE "CurriculumCapability";
DROP TYPE "CurriculumCapabilityScope";
DROP TYPE "CurriculumImportStatus";
DROP TYPE "CurriculumIssueDisposition";
DROP TYPE "CurriculumIssueSeverity";
DROP TYPE "CurriculumMappingStatus";
DROP TYPE "CurriculumMappingType";
DROP TYPE "CurriculumNodeAvailability";
DROP TYPE "CurriculumRelationshipStatus";
DROP TYPE "CurriculumRelationshipType";
DROP TYPE "CurriculumReviewOutcome";
DROP TYPE "CurriculumSourceDisposition";
DROP TYPE "CurriculumValidationStatus";
DROP TYPE "CurriculumVersionStatus";
DROP TYPE "LegacyCurriculumDecision";
DROP TYPE "LegacyCurriculumKind";
