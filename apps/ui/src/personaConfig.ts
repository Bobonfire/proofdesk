type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPath(source: unknown, path: string): unknown {
  const segments = path.split(".");
  let cursor: unknown = source;
  for (const segment of segments) {
    if (!isRecord(cursor) || !(segment in cursor)) {
      return undefined;
    }

    cursor = cursor[segment];
  }

  return cursor;
}

function assertPathType(source: unknown, path: string, expected: "string" | "number" | "boolean", errors: string[]): void {
  const value = readPath(source, path);
  if (typeof value !== expected) {
    errors.push(`Expected ${path} to be a ${expected}.`);
  }
}

export const DEFAULT_PERSONA_CONFIG = {
  proofdesk_project_persona: {
    metadata: {
      version: 1.0,
      created_by: "<creator_name>",
      project_name: "<project_name>",
      created_at: "<YYYY-MM-DD>",
      description: "Proofdesk execution behavior configuration profile"
    },
    creator_profile: {
      role: "idea_owner",
      technical_confidence_level: "no_technical_background",
      preferred_system_behavior: "hide_technical_details"
    },
    project_goal: {
      build_type: "public_product",
      first_milestone_output: "deployable_mvp",
      target_audience: "public_users"
    },
    execution_style: {
      autonomy_level: "fully_guided_execution",
      suggestion_policy: "minor_improvements_only",
      scope_change_without_approval: "never_allowed"
    },
    workflow_visibility: {
      visibility_level: "structured",
      progress_tracking_format: "milestones"
    },
    approval_strategy: {
      approval_frequency: "major_milestones",
      approval_delay_behavior: "continue_with_safe_defaults"
    },
    technical_exposure_boundaries: {
      forbid: {
        reading_source_code: true,
        running_scripts: true,
        environment_setup: true,
        architecture_decisions: true,
        deployment_configuration: true,
        testing_strategy_selection: true,
        release_management: true
      }
    },
    reliability_expectations: {
      primary_priority: "predictable_progress",
      failure_fallback_behavior: "retry_automatically"
    },
    suggestion_behavior: {
      allowed_suggestions: {
        ux_improvements: true,
        feature_completeness_checks: true,
        missing_edge_cases: true,
        architecture_optimizations: false,
        performance_improvements: false,
        security_improvements: true
      },
      suggestion_strength: "recommended"
    },
    product_definition_authority: {
      ownership_model: "creator_with_proofdesk_suggestions",
      enforcement_level: "strict_enforcement"
    },
    success_criteria: {
      phase_success_condition: "deployable_mvp_available",
      primary_success_metric: "launch_readiness"
    },
    agent_execution_policy: {
      architecture_decision_owner: "proofdesk",
      deployment_strategy_owner: "proofdesk",
      testing_strategy_owner: "proofdesk",
      release_strategy_owner: "proofdesk",
      scope_protection_mode: "strict",
      technical_visibility_filtering: true,
      approval_checkpoint_strategy: "milestone_based",
      suggestion_behavior_mode: "non_intrusive_guidance"
    },
    guardrails: {
      never_require_user_to: {
        inspect_source_code: true,
        run_terminal_commands: true,
        configure_environments: true,
        manage_repositories: true,
        resolve_dependencies: true
      },
      must_always: {
        preserve_product_definition: true,
        request_scope_change_approval: true,
        maintain_feature_stability_after_approval: true,
        provide_progress_transparency: true
      }
    },
    orchestration_hints: {
      preferred_agent_behavior: {
        explanation_style: "plain_language",
        interruption_frequency: "low",
        execution_mode: "autonomous_with_checkpoints"
      },
      workflow_bias: {
        prioritize_speed: false,
        prioritize_stability: true,
        prioritize_predictability: true,
        prioritize_control: true
      }
    }
  }
} as const;

export const DEFAULT_PERSONA_YAML = `proofdesk_project_persona:
  metadata:
    version: 1.0
    created_by: "<creator_name>"
    project_name: "<project_name>"
    created_at: "<YYYY-MM-DD>"
    description: "Proofdesk execution behavior configuration profile"

  creator_profile:
    role: "idea_owner"
    technical_confidence_level: "no_technical_background"
    preferred_system_behavior: "hide_technical_details"

  project_goal:
    build_type: "public_product"
    first_milestone_output: "deployable_mvp"
    target_audience: "public_users"

  execution_style:
    autonomy_level: "fully_guided_execution"
    suggestion_policy: "minor_improvements_only"
    scope_change_without_approval: "never_allowed"

  workflow_visibility:
    visibility_level: "structured"
    progress_tracking_format: "milestones"

  approval_strategy:
    approval_frequency: "major_milestones"
    approval_delay_behavior: "continue_with_safe_defaults"

  technical_exposure_boundaries:
    forbid:
      reading_source_code: true
      running_scripts: true
      environment_setup: true
      architecture_decisions: true
      deployment_configuration: true
      testing_strategy_selection: true
      release_management: true

  reliability_expectations:
    primary_priority: "predictable_progress"
    failure_fallback_behavior: "retry_automatically"

  suggestion_behavior:
    allowed_suggestions:
      ux_improvements: true
      feature_completeness_checks: true
      missing_edge_cases: true
      architecture_optimizations: false
      performance_improvements: false
      security_improvements: true
    suggestion_strength: "recommended"

  product_definition_authority:
    ownership_model: "creator_with_proofdesk_suggestions"
    enforcement_level: "strict_enforcement"

  success_criteria:
    phase_success_condition: "deployable_mvp_available"
    primary_success_metric: "launch_readiness"

  agent_execution_policy:
    architecture_decision_owner: "proofdesk"
    deployment_strategy_owner: "proofdesk"
    testing_strategy_owner: "proofdesk"
    release_strategy_owner: "proofdesk"
    scope_protection_mode: "strict"
    technical_visibility_filtering: true
    approval_checkpoint_strategy: "milestone_based"
    suggestion_behavior_mode: "non_intrusive_guidance"

  guardrails:
    never_require_user_to:
      inspect_source_code: true
      run_terminal_commands: true
      configure_environments: true
      manage_repositories: true
      resolve_dependencies: true

    must_always:
      preserve_product_definition: true
      request_scope_change_approval: true
      maintain_feature_stability_after_approval: true
      provide_progress_transparency: true

  orchestration_hints:
    preferred_agent_behavior:
      explanation_style: "plain_language"
      interruption_frequency: "low"
      execution_mode: "autonomous_with_checkpoints"

    workflow_bias:
      prioritize_speed: false
      prioritize_stability: true
      prioritize_predictability: true
      prioritize_control: true
`;

export const PERSONA_SCHEMA_JSON = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://proofdesk.local/schemas/persona.schema.json",
  "title": "ProofDesk Project Persona",
  "type": "object",
  "additionalProperties": false,
  "required": ["proofdesk_project_persona"],
  "properties": {
    "proofdesk_project_persona": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "metadata",
        "creator_profile",
        "project_goal",
        "execution_style",
        "workflow_visibility",
        "approval_strategy",
        "technical_exposure_boundaries",
        "reliability_expectations",
        "suggestion_behavior",
        "product_definition_authority",
        "success_criteria",
        "agent_execution_policy",
        "guardrails",
        "orchestration_hints"
      ],
      "properties": {
        "metadata": {
          "type": "object",
          "additionalProperties": false,
          "required": ["version", "created_by", "project_name", "created_at", "description"],
          "properties": {
            "version": { "type": "number" },
            "created_by": { "type": "string", "minLength": 1 },
            "project_name": { "type": "string", "minLength": 1 },
            "created_at": { "type": "string", "minLength": 1 },
            "description": { "type": "string", "minLength": 1 }
          }
        },
        "creator_profile": {
          "type": "object",
          "additionalProperties": false,
          "required": ["role", "technical_confidence_level", "preferred_system_behavior"],
          "properties": {
            "role": { "type": "string" },
            "technical_confidence_level": { "type": "string" },
            "preferred_system_behavior": { "type": "string" }
          }
        },
        "project_goal": {
          "type": "object",
          "additionalProperties": false,
          "required": ["build_type", "first_milestone_output", "target_audience"],
          "properties": {
            "build_type": { "type": "string" },
            "first_milestone_output": { "type": "string" },
            "target_audience": { "type": "string" }
          }
        },
        "execution_style": {
          "type": "object",
          "additionalProperties": false,
          "required": ["autonomy_level", "suggestion_policy", "scope_change_without_approval"],
          "properties": {
            "autonomy_level": { "type": "string" },
            "suggestion_policy": { "type": "string" },
            "scope_change_without_approval": { "type": "string" }
          }
        },
        "workflow_visibility": {
          "type": "object",
          "additionalProperties": false,
          "required": ["visibility_level", "progress_tracking_format"],
          "properties": {
            "visibility_level": { "type": "string" },
            "progress_tracking_format": { "type": "string" }
          }
        },
        "approval_strategy": {
          "type": "object",
          "additionalProperties": false,
          "required": ["approval_frequency", "approval_delay_behavior"],
          "properties": {
            "approval_frequency": { "type": "string" },
            "approval_delay_behavior": { "type": "string" }
          }
        },
        "technical_exposure_boundaries": {
          "type": "object",
          "additionalProperties": false,
          "required": ["forbid"],
          "properties": {
            "forbid": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "reading_source_code",
                "running_scripts",
                "environment_setup",
                "architecture_decisions",
                "deployment_configuration",
                "testing_strategy_selection",
                "release_management"
              ],
              "properties": {
                "reading_source_code": { "type": "boolean" },
                "running_scripts": { "type": "boolean" },
                "environment_setup": { "type": "boolean" },
                "architecture_decisions": { "type": "boolean" },
                "deployment_configuration": { "type": "boolean" },
                "testing_strategy_selection": { "type": "boolean" },
                "release_management": { "type": "boolean" }
              }
            }
          }
        },
        "reliability_expectations": {
          "type": "object",
          "additionalProperties": false,
          "required": ["primary_priority", "failure_fallback_behavior"],
          "properties": {
            "primary_priority": { "type": "string" },
            "failure_fallback_behavior": { "type": "string" }
          }
        },
        "suggestion_behavior": {
          "type": "object",
          "additionalProperties": false,
          "required": ["allowed_suggestions", "suggestion_strength"],
          "properties": {
            "allowed_suggestions": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "ux_improvements",
                "feature_completeness_checks",
                "missing_edge_cases",
                "architecture_optimizations",
                "performance_improvements",
                "security_improvements"
              ],
              "properties": {
                "ux_improvements": { "type": "boolean" },
                "feature_completeness_checks": { "type": "boolean" },
                "missing_edge_cases": { "type": "boolean" },
                "architecture_optimizations": { "type": "boolean" },
                "performance_improvements": { "type": "boolean" },
                "security_improvements": { "type": "boolean" }
              }
            },
            "suggestion_strength": { "type": "string" }
          }
        },
        "product_definition_authority": {
          "type": "object",
          "additionalProperties": false,
          "required": ["ownership_model", "enforcement_level"],
          "properties": {
            "ownership_model": { "type": "string" },
            "enforcement_level": { "type": "string" }
          }
        },
        "success_criteria": {
          "type": "object",
          "additionalProperties": false,
          "required": ["phase_success_condition", "primary_success_metric"],
          "properties": {
            "phase_success_condition": { "type": "string" },
            "primary_success_metric": { "type": "string" }
          }
        },
        "agent_execution_policy": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "architecture_decision_owner",
            "deployment_strategy_owner",
            "testing_strategy_owner",
            "release_strategy_owner",
            "scope_protection_mode",
            "technical_visibility_filtering",
            "approval_checkpoint_strategy",
            "suggestion_behavior_mode"
          ],
          "properties": {
            "architecture_decision_owner": { "type": "string" },
            "deployment_strategy_owner": { "type": "string" },
            "testing_strategy_owner": { "type": "string" },
            "release_strategy_owner": { "type": "string" },
            "scope_protection_mode": { "type": "string" },
            "technical_visibility_filtering": { "type": "boolean" },
            "approval_checkpoint_strategy": { "type": "string" },
            "suggestion_behavior_mode": { "type": "string" }
          }
        },
        "guardrails": {
          "type": "object",
          "additionalProperties": false,
          "required": ["never_require_user_to", "must_always"],
          "properties": {
            "never_require_user_to": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "inspect_source_code",
                "run_terminal_commands",
                "configure_environments",
                "manage_repositories",
                "resolve_dependencies"
              ],
              "properties": {
                "inspect_source_code": { "type": "boolean" },
                "run_terminal_commands": { "type": "boolean" },
                "configure_environments": { "type": "boolean" },
                "manage_repositories": { "type": "boolean" },
                "resolve_dependencies": { "type": "boolean" }
              }
            },
            "must_always": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "preserve_product_definition",
                "request_scope_change_approval",
                "maintain_feature_stability_after_approval",
                "provide_progress_transparency"
              ],
              "properties": {
                "preserve_product_definition": { "type": "boolean" },
                "request_scope_change_approval": { "type": "boolean" },
                "maintain_feature_stability_after_approval": { "type": "boolean" },
                "provide_progress_transparency": { "type": "boolean" }
              }
            }
          }
        },
        "orchestration_hints": {
          "type": "object",
          "additionalProperties": false,
          "required": ["preferred_agent_behavior", "workflow_bias"],
          "properties": {
            "preferred_agent_behavior": {
              "type": "object",
              "additionalProperties": false,
              "required": ["explanation_style", "interruption_frequency", "execution_mode"],
              "properties": {
                "explanation_style": { "type": "string" },
                "interruption_frequency": { "type": "string" },
                "execution_mode": { "type": "string" }
              }
            },
            "workflow_bias": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "prioritize_speed",
                "prioritize_stability",
                "prioritize_predictability",
                "prioritize_control"
              ],
              "properties": {
                "prioritize_speed": { "type": "boolean" },
                "prioritize_stability": { "type": "boolean" },
                "prioritize_predictability": { "type": "boolean" },
                "prioritize_control": { "type": "boolean" }
              }
            }
          }
        }
      }
    }
  }
}
`;

export interface PersonaBootstrapArtifacts {
  yamlPath: ".proofdesk/persona.yaml";
  schemaPath: ".proofdesk/persona.schema.json";
  yamlContent: string;
  schemaContent: string;
  orchestrationContext: {
    persona_file: ".proofdesk/persona.yaml";
    persona_schema_file: ".proofdesk/persona.schema.json";
    inject_into_agent_orchestration_context: true;
  };
}

export function validatePersonaConfig(source: unknown): string[] {
  const errors: string[] = [];

  assertPathType(source, "proofdesk_project_persona.metadata.version", "number", errors);

  const requiredStringPaths = [
    "proofdesk_project_persona.metadata.created_by",
    "proofdesk_project_persona.metadata.project_name",
    "proofdesk_project_persona.metadata.created_at",
    "proofdesk_project_persona.metadata.description",
    "proofdesk_project_persona.creator_profile.role",
    "proofdesk_project_persona.creator_profile.technical_confidence_level",
    "proofdesk_project_persona.creator_profile.preferred_system_behavior",
    "proofdesk_project_persona.project_goal.build_type",
    "proofdesk_project_persona.project_goal.first_milestone_output",
    "proofdesk_project_persona.project_goal.target_audience",
    "proofdesk_project_persona.execution_style.autonomy_level",
    "proofdesk_project_persona.execution_style.suggestion_policy",
    "proofdesk_project_persona.execution_style.scope_change_without_approval",
    "proofdesk_project_persona.workflow_visibility.visibility_level",
    "proofdesk_project_persona.workflow_visibility.progress_tracking_format",
    "proofdesk_project_persona.approval_strategy.approval_frequency",
    "proofdesk_project_persona.approval_strategy.approval_delay_behavior",
    "proofdesk_project_persona.reliability_expectations.primary_priority",
    "proofdesk_project_persona.reliability_expectations.failure_fallback_behavior",
    "proofdesk_project_persona.suggestion_behavior.suggestion_strength",
    "proofdesk_project_persona.product_definition_authority.ownership_model",
    "proofdesk_project_persona.product_definition_authority.enforcement_level",
    "proofdesk_project_persona.success_criteria.phase_success_condition",
    "proofdesk_project_persona.success_criteria.primary_success_metric",
    "proofdesk_project_persona.agent_execution_policy.architecture_decision_owner",
    "proofdesk_project_persona.agent_execution_policy.deployment_strategy_owner",
    "proofdesk_project_persona.agent_execution_policy.testing_strategy_owner",
    "proofdesk_project_persona.agent_execution_policy.release_strategy_owner",
    "proofdesk_project_persona.agent_execution_policy.scope_protection_mode",
    "proofdesk_project_persona.agent_execution_policy.approval_checkpoint_strategy",
    "proofdesk_project_persona.agent_execution_policy.suggestion_behavior_mode",
    "proofdesk_project_persona.orchestration_hints.preferred_agent_behavior.explanation_style",
    "proofdesk_project_persona.orchestration_hints.preferred_agent_behavior.interruption_frequency",
    "proofdesk_project_persona.orchestration_hints.preferred_agent_behavior.execution_mode"
  ];

  for (const path of requiredStringPaths) {
    assertPathType(source, path, "string", errors);
  }

  const requiredBooleanPaths = [
    "proofdesk_project_persona.technical_exposure_boundaries.forbid.reading_source_code",
    "proofdesk_project_persona.technical_exposure_boundaries.forbid.running_scripts",
    "proofdesk_project_persona.technical_exposure_boundaries.forbid.environment_setup",
    "proofdesk_project_persona.technical_exposure_boundaries.forbid.architecture_decisions",
    "proofdesk_project_persona.technical_exposure_boundaries.forbid.deployment_configuration",
    "proofdesk_project_persona.technical_exposure_boundaries.forbid.testing_strategy_selection",
    "proofdesk_project_persona.technical_exposure_boundaries.forbid.release_management",
    "proofdesk_project_persona.suggestion_behavior.allowed_suggestions.ux_improvements",
    "proofdesk_project_persona.suggestion_behavior.allowed_suggestions.feature_completeness_checks",
    "proofdesk_project_persona.suggestion_behavior.allowed_suggestions.missing_edge_cases",
    "proofdesk_project_persona.suggestion_behavior.allowed_suggestions.architecture_optimizations",
    "proofdesk_project_persona.suggestion_behavior.allowed_suggestions.performance_improvements",
    "proofdesk_project_persona.suggestion_behavior.allowed_suggestions.security_improvements",
    "proofdesk_project_persona.agent_execution_policy.technical_visibility_filtering",
    "proofdesk_project_persona.guardrails.never_require_user_to.inspect_source_code",
    "proofdesk_project_persona.guardrails.never_require_user_to.run_terminal_commands",
    "proofdesk_project_persona.guardrails.never_require_user_to.configure_environments",
    "proofdesk_project_persona.guardrails.never_require_user_to.manage_repositories",
    "proofdesk_project_persona.guardrails.never_require_user_to.resolve_dependencies",
    "proofdesk_project_persona.guardrails.must_always.preserve_product_definition",
    "proofdesk_project_persona.guardrails.must_always.request_scope_change_approval",
    "proofdesk_project_persona.guardrails.must_always.maintain_feature_stability_after_approval",
    "proofdesk_project_persona.guardrails.must_always.provide_progress_transparency",
    "proofdesk_project_persona.orchestration_hints.workflow_bias.prioritize_speed",
    "proofdesk_project_persona.orchestration_hints.workflow_bias.prioritize_stability",
    "proofdesk_project_persona.orchestration_hints.workflow_bias.prioritize_predictability",
    "proofdesk_project_persona.orchestration_hints.workflow_bias.prioritize_control"
  ];

  for (const path of requiredBooleanPaths) {
    assertPathType(source, path, "boolean", errors);
  }

  return errors;
}

export function createPersonaBootstrapArtifacts(): PersonaBootstrapArtifacts {
  const errors = validatePersonaConfig(DEFAULT_PERSONA_CONFIG);
  if (errors.length > 0) {
    throw new Error(`Invalid proofdesk persona config: ${errors.join(" | ")}`);
  }

  return {
    yamlPath: ".proofdesk/persona.yaml",
    schemaPath: ".proofdesk/persona.schema.json",
    yamlContent: DEFAULT_PERSONA_YAML,
    schemaContent: PERSONA_SCHEMA_JSON,
    orchestrationContext: {
      persona_file: ".proofdesk/persona.yaml",
      persona_schema_file: ".proofdesk/persona.schema.json",
      inject_into_agent_orchestration_context: true
    }
  };
}
