package com.webhook.platform.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(
    packages = "com.webhook.platform",
    importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureTest {

  @ArchTest
  static final ArchRule layered_architecture =
      layeredArchitecture()
          .consideringOnlyDependenciesInAnyPackage("com.webhook.platform..")
          .layer("Domain")
          .definedBy("..domain..")
          .layer("Application")
          .definedBy("..application..")
          .layer("AdaptersIn")
          .definedBy("..adapters.in..")
          .layer("AdaptersOut")
          .definedBy("..adapters.out..")
          .layer("Infra")
          .definedBy("..infra..")

          // Domain Rules
          // Domain is accessed by Application, Adapters (Entities moved to Domain/Entity), Infra
          // (SecurityUser wraps User)
          .whereLayer("Domain")
          .mayOnlyBeAccessedByLayers("Application", "AdaptersIn", "AdaptersOut", "Infra")
          // Domain depends on NOTHING (Pure) - but we allowed Entities in Domain/Entity, so it
          // depends on Jakarta Persistence.
          // But Jakarta is not a "Layer". It's a library.
          // Does Domain depend on other layers? No.
          .whereLayer("Domain")
          .mayNotAccessAnyLayer()

          // Application Rules
          // Application is accessed by AdaptersIn (Controllers), Infra (Configs)
          // Application depends on Domain.
          // Application depends on AdaptersOut? NO. Repositories moved to Application/Repository.
          // Application depends on AdaptersIn? NO.
          // Application depends on Infra? NO.
          .whereLayer("Application")
          .mayOnlyAccessLayers("Domain")

          // AdaptersIn Rules (Controllers, Consumers, Schedulers)
          // Access Application (Services), Domain (DTOs/Entities), Infra (Config?)
          // AdaptersIn should NOT access AdaptersOut (Directly).
          // But OutboxDispatcher (AdaptersIn) used to access Repo (AdaptersOut).
          // Now Repo is in Application. So OutboxDispatcher accesses Application. VALID.
          .whereLayer("AdaptersIn")
          .mayOnlyAccessLayers("Application", "Domain", "Infra")

          // AdaptersOut Rules (Persistence Impl - if any, External Clients)
          // Currently Persistence Repos are in Application. So AdaptersOut might be empty or
          // contain other stuff.
          // If we have RabbitMQ Publisher?
          .whereLayer("AdaptersOut")
          .mayOnlyAccessLayers("Application", "Domain", "Infra")

          // Infra Rules
          .whereLayer("Infra")
          .mayOnlyAccessLayers("Application", "Domain", "AdaptersIn", "AdaptersOut");

  @ArchTest
  static final ArchRule domain_should_not_depend_on_spring =
      noClasses()
          .that()
          .resideInAPackage("..domain..")
          .should()
          .dependOnClassesThat()
          .resideInAPackage("org.springframework..");

  // This is crucial. We fixed User.java.
  // But we have @Entity in domain/entity. Does it use Spring? No, Jakarta.
  // So this should PASS.

  @ArchTest
  static final ArchRule application_should_not_depend_on_adapters =
      noClasses()
          .that()
          .resideInAPackage("..application..")
          .should()
          .dependOnClassesThat()
          .resideInAPackage("..adapters..");

  // This was the main goal. We moved Repos to Application to fix this.

  @ArchTest
  static final ArchRule infra_should_not_leak_to_domain =
      noClasses()
          .that()
          .resideInAPackage("..domain..")
          .should()
          .dependOnClassesThat()
          .resideInAPackage("..infra..");
}
