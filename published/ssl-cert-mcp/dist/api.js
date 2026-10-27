import { connect } from "node:tls";
export class CertError extends Error {
}
export async function certInfo(args) {
    const host = (args.host ?? "").trim();
    if (!host)
        throw new CertError("Provide a hostname");
    const port = Math.min(Math.max(args.port ?? 443, 1), 65535);
    const cert = await new Promise((resolve, reject) => {
        const socket = connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
            const c = socket.getPeerCertificate();
            socket.end();
            resolve(c);
        });
        socket.on("error", (e) => reject(new CertError(`TLS error: ${e.message}`)));
        socket.on("timeout", () => { socket.destroy(); reject(new CertError("TLS handshake timed out")); });
    });
    if (!cert || !cert.subject)
        throw new CertError("No certificate returned");
    const san = (cert.subjectaltname ?? "").split(", ").slice(0, 10).join(", ");
    return [
        `Host: ${host}:${port}`,
        `Subject: ${cert.subject.CN ?? ""} (${cert.subject.O ?? ""})`,
        `Issuer: ${cert.issuer.CN ?? ""} (${cert.issuer.O ?? ""})`,
        `Valid from: ${cert.valid_from ?? ""}`,
        `Valid to: ${cert.valid_to ?? ""}`,
        `Serial: ${cert.serialNumber ?? ""}`,
        `Bits: ${cert.bits ?? ""}`,
        san ? `SAN: ${san}` : "",
    ].filter(Boolean).join("\n");
}
// ---- muxC tools:
/**
 * Open one TLS connection and hand the live socket to the caller, so a tool can
 * read both the certificate and what the handshake actually negotiated.
 */
function tlsConnect(host, port) {
    return new Promise((resolve, reject) => {
        const socket = connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
            const cert = socket.getPeerCertificate(true);
            resolve({ socket, cert });
        });
        socket.on("error", (e) => reject(new CertError(`TLS error: ${e.message}`)));
        socket.on("timeout", () => {
            socket.destroy();
            reject(new CertError("TLS handshake timed out"));
        });
    });
}
function hostPort(args) {
    const host = (args.host ?? "").trim();
    if (!host)
        throw new CertError("Provide a hostname");
    const port = Math.min(Math.max(args.port ?? 443, 1), 65535);
    return { host, port };
}
