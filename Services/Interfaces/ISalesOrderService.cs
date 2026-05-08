using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.SalesOrder;
using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface ISalesOrderService
    {
        Task ConfirmOrder(int salesOrderId);
        Task<int> CreateOrder(int clientId, List<CreateOrderItemDto> items);
        Task SetPrices(int salesOrderId, List<SetPriceDto> items);
        Task<SalesOrder> GetById(int salesOrderId);
    }
}