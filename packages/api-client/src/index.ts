import type { ApiResponse } from "@drivebook/shared-types";

export interface ApiClientOptions {
  baseUrl: string;
}

export function createApiClient(options: ApiClientOptions) {
  return {
    baseUrl: options.baseUrl,
    async health(): Promise<ApiResponse<{ ok: boolean }>> {
      return { data: { ok: true } };
    }
  };
}
