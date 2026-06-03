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
        Task<List<SalesOrderDto>> GetAllAsync();
        Task<List<SalesOrderDto>> GetOrdersForUserAsync(string userId);
        Task<SalesOrderDto?> GetDtoByIdAsync(int salesOrderId);
        Task ConfirmOrder(int salesOrderId);
        Task ConfirmOrderForUser(string userId, int salesOrderId);
        Task CancelOrder(int salesOrderId);
        Task CancelOrderForUser(string userId, int salesOrderId);
        Task<int> CreateOrder(int clientId, List<CreateOrderItemDto> items);
        Task<int> CreateOrderForUser(string userId, List<CreateOrderItemDto> items);
        Task SetPrices(int salesOrderId, List<SetPriceDto> items);
        Task<SalesOrder> GetById(int salesOrderId);
    }
}