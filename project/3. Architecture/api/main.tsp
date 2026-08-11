import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{ title: "Calendar technical foundation API" })
namespace Calendar.Api;

/** Infrastructure response used to verify the contract and runtime pipeline. */
model HealthResponse {
  status: "ok";
}

/** Reports whether the HTTP process and its SQLite dependency are ready. */
@route("/api/health")
@get
op getHealth(): HealthResponse;
