-- ===================================================
-- Script: crear_tablas_notas_credito.sql
-- Descripción: Crea las tablas para el módulo Notas Crédito
-- Fecha: Mayo 2026
-- ===================================================

CREATE TABLE IF NOT EXISTS EncabNotaCredito (
    Id_EncabNotaCredito INT(11) NOT NULL AUTO_INCREMENT,
    Id_Cliente INT(11) NOT NULL,
    Numero VARCHAR(15) NOT NULL,
    Fecha DATE NOT NULL,
    Motivo TEXT,
    ValorTotalCOP DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    ValorTotalUSD DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    Estado VARCHAR(15) NOT NULL DEFAULT 'Activo',
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioRegistro VARCHAR(100) DEFAULT 'Sistema',
    PRIMARY KEY (Id_EncabNotaCredito),
    KEY idx_cliente (Id_Cliente),
    KEY idx_fecha (Fecha),
    KEY idx_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS DetNotaCredito (
    Id_DetNotaCredito INT(11) NOT NULL AUTO_INCREMENT,
    Id_EncabNotaCredito INT(11) NOT NULL,
    Id_EncabPedido INT(11) NOT NULL,
    Id_DetPedido INT(11) NOT NULL DEFAULT 0,
    Id_Producto INT(11) NOT NULL,
    Descripcion VARCHAR(255) DEFAULT '',
    Id_Embalaje INT(11) DEFAULT NULL,
    CantidadOriginal FLOAT NOT NULL DEFAULT 0,
    CantidadCredito FLOAT NOT NULL DEFAULT 0,
    PesoNetoCredito FLOAT NOT NULL DEFAULT 0,
    PrecioUnitario FLOAT NOT NULL DEFAULT 0,
    ValorCreditoCOP FLOAT NOT NULL DEFAULT 0,
    FechaSalidaPedido DATE DEFAULT NULL,
    Item INT(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (Id_DetNotaCredito),
    KEY idx_encab (Id_EncabNotaCredito),
    KEY idx_encabpedido (Id_EncabPedido),
    KEY idx_detpedido (Id_DetPedido),
    KEY idx_producto (Id_Producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
